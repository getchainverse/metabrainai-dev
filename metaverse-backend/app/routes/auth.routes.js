const { verifySignUp, authJwt } = require("../middleware");
const { authLimiter } = require("../middleware/rateLimit");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      authLimiter,
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  app.post("/api/auth/signin", [authLimiter], controller.signin);

  app.post("/api/auth/signout", controller.signout);

  app.post("/api/auth/sendmail", [authLimiter], controller.sendMail);

  app.post(
    "/api/auth/resetpasswordbyuser",
    [authLimiter],
    controller.resetPasswordByUser
  );

  app.post("/api/auth/getlastexpiredtime", controller.getLastExpiredTime);

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
