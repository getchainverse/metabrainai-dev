const walletAuthService = require("../services/wallet-auth.service");
const prisma = require("../prisma/client");

exports.createNonce = (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).send({ message: "Wallet address is required." });
    }

    return res.status(200).send(walletAuthService.createNonceChallenge(walletAddress));
  } catch (error) {
    return res.status(400).send({ message: "Invalid wallet address." });
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const { walletAddress, signature, nonceToken } = req.body;

    if (!walletAddress || !signature || !nonceToken) {
      return res.status(400).send({
        message: "Wallet address, signature, and nonce token are required.",
      });
    }

    const session = await walletAuthService.verifyWalletLogin({
      walletAddress,
      signature,
      nonceToken,
    });

    return res.status(200).send(session);
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).send({
      message: error.message || "Wallet authentication failed.",
    });
  }
};

exports.getCurrentWalletUser = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    return res.status(200).send({ user });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};
