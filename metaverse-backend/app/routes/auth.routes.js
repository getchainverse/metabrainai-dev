const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const controller = require("../controllers/auth.controller");
const walletController = require("../controllers/wallet-auth.controller");
const rateLimit = require("../middleware/rateLimit");

module.exports = function (app) {
  app.post(
    "/api/auth/signup",
    rateLimit({ max: 5, windowMs: 60_000, keyPrefix: "auth-signup" }),
    [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
    controller.signup
  );

  app.post(
    "/api/auth/signin",
    rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "auth-signin" }),
    controller.signin
  );

  app.post(
    "/api/auth/wallet/nonce",
    rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "wallet-nonce" }),
    walletController.createNonce
  );

  app.post(
    "/api/auth/wallet/verify",
    rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "wallet-verify" }),
    walletController.verifySignature
  );

  app.get(
    "/api/auth/wallet/me",
    [authJwt.verifyToken],
    walletController.getCurrentWalletUser
  );

  app.post("/api/auth/signout", controller.signout);

  app.post(
    "/api/auth/sendmail",
    rateLimit({ max: 5, windowMs: 60_000, keyPrefix: "auth-sendmail" }),
    controller.sendMail
  );

  app.post(
    "/api/auth/resetpasswordbyuser",
    rateLimit({ max: 5, windowMs: 60_000, keyPrefix: "auth-reset" }),
    controller.resetPasswordByUser
  );

  app.post(
    "/api/auth/getlastexpiredtime",
    rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "auth-expired" }),
    controller.getLastExpiredTime
  );

  app.post(
    "/api/auth/setrolebyuser",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.setRoleByUser
  );

  app.get(
    "/api/auth/getalluserdata",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getAllUserData
  );
};
