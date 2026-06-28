const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { verifyMessage, getAddress } = require("ethers");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;

const NONCE_TTL_SECONDS = 300;
const ACCESS_TOKEN_TTL_SECONDS = 86400;

const buildMessage = (walletAddress, nonce) =>
  [
    "Sign in to MetaBrain AI",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
  ].join("\n");

const normalizeWalletAddress = (walletAddress) => getAddress(walletAddress);

const createNonceChallenge = (walletAddress) => {
  const normalizedAddress = normalizeWalletAddress(walletAddress);
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = buildMessage(normalizedAddress, nonce);
  const nonceToken = jwt.sign(
    {
      type: "wallet_nonce",
      walletAddress: normalizedAddress,
      nonce,
    },
    config.secret,
    { expiresIn: NONCE_TTL_SECONDS }
  );

  return {
    walletAddress: normalizedAddress,
    message,
    nonceToken,
    expiresIn: NONCE_TTL_SECONDS,
  };
};

const verifyWalletLogin = async ({ walletAddress, signature, nonceToken }) => {
  const decoded = jwt.verify(nonceToken, config.secret);

  if (decoded.type !== "wallet_nonce") {
    const error = new Error("Invalid nonce token.");
    error.statusCode = 401;
    throw error;
  }

  const normalizedAddress = normalizeWalletAddress(walletAddress);

  if (decoded.walletAddress !== normalizedAddress) {
    const error = new Error("Wallet address does not match nonce.");
    error.statusCode = 401;
    throw error;
  }

  const recoveredAddress = normalizeWalletAddress(
    verifyMessage(buildMessage(normalizedAddress, decoded.nonce), signature)
  );

  if (recoveredAddress !== normalizedAddress) {
    const error = new Error("Invalid wallet signature.");
    error.statusCode = 401;
    throw error;
  }

  // Find existing user or create a new one
  let user = await User.findOne({
    where: { walletAddress: normalizedAddress },
  });

  if (!user) {
    user = await User.create({
      walletAddress: normalizedAddress,
      username: `user-${normalizedAddress.slice(2, 8).toLowerCase()}`,
      authProvider: "metamask",
    });
    // Give new user the default role (role id 1 = "user")
    await user.setRoles([1]);
  }

  // Get authorities for JWT
  let authorities = [];
  const roles = await user.getRoles();
  for (let i = 0; i < roles.length; i++) {
    authorities.push("ROLE_" + roles[i].name.toUpperCase());
  }

  const accessToken = jwt.sign(
    {
      id: user.id,
      walletAddress: user.walletAddress,
      roles: authorities,
    },
    config.secret,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  );

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    user: {
      id: user.id,
      username: user.username,
      walletAddress: user.walletAddress,
      roles: authorities,
    }
  };
};

module.exports = {
  createNonceChallenge,
  verifyWalletLogin,
};
