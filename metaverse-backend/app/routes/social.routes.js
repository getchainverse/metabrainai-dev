const { authJwt } = require("../middleware");
const controller = require("../controllers/social.controller");
const rateLimit = require("../middleware/rateLimit");

module.exports = function (app) {
  app.get("/api/social/friends", [authJwt.verifyToken], controller.friends);
  app.get("/api/social/requests", [authJwt.verifyToken], controller.requests);
  app.get("/api/social/notifications", [authJwt.verifyToken], controller.notifications);
  app.get("/api/social/messages/:friendId", [authJwt.verifyToken], controller.messages);
  app.post("/api/social/friend-requests", [authJwt.verifyToken, rateLimit({ max: 20, windowMs: 60_000, keyPrefix: "friend-requests" })], controller.sendFriendRequest);
  app.patch("/api/social/friend-requests/:id", [authJwt.verifyToken], controller.respondToFriendRequest);
  app.post("/api/social/messages", [authJwt.verifyToken, rateLimit({ max: 60, windowMs: 60_000, keyPrefix: "direct-messages" })], controller.sendMessage);
  app.patch("/api/social/notifications/:id/read", [authJwt.verifyToken], controller.markNotificationRead);
};
