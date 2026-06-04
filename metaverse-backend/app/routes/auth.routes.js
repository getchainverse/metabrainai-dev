const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/signout", controller.signout);

  app.post("/api/auth/sendmail", controller.sendMail);

  app.post("/api/auth/resetpasswordbyuser", controller.resetPasswordByUser);

  app.post("/api/auth/getlastexpiredtime", controller.getLastExpiredTime);

  app.post("/api/auth/setrolebyuser", controller.setRoleByUser);

  app.get("/api/auth/getalluserdata", controller.getAllUserData);

};
