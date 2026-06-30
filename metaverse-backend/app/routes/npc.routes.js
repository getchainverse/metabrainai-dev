const { authJwt } = require("../middleware");
const controller = require("../controllers/npc.controller");
const rateLimit = require("../middleware/rateLimit");

module.exports = function (app) {
  app.get("/api/npc/history", [authJwt.verifyToken], controller.history);
  app.post("/api/npc/chat", [authJwt.verifyToken, rateLimit({ max: 15, windowMs: 60_000, keyPrefix: "npc-chat" })], controller.chat);
};
