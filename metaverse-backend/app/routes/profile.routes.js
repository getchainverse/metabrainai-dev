const { authJwt } = require("../middleware");
const controller = require("../controllers/profile.controller");
const rateLimit = require("../middleware/rateLimit");

const profileLimit = rateLimit({ max: 60, windowMs: 60_000, keyPrefix: "profile" });

module.exports = function (app) {
  app.get("/profile", [authJwt.verifyToken, profileLimit], controller.getProfile);
  app.patch("/profile", [authJwt.verifyToken, profileLimit], controller.updateProfile);
  app.get(
    "/avatar-customization",
    [authJwt.verifyToken, profileLimit],
    controller.getAvatarCustomization
  );
  app.patch(
    "/avatar-customization",
    [authJwt.verifyToken, profileLimit],
    controller.updateAvatarCustomization
  );
};
