const { authJwt } = require("../middleware");
const controller = require("../controllers/store.controller");
const rateLimit = require("../middleware/rateLimit");

module.exports = function (app) {
  app.get("/api/store/categories", controller.listCategories);
  app.get("/api/store/items", controller.listItems);
  app.get("/api/store/inventory", [authJwt.verifyToken], controller.getInventory);
  app.get("/api/store/transactions", [authJwt.verifyToken], controller.getTransactions);
  app.post("/api/store/purchase", [authJwt.verifyToken, rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "store-purchase" })], controller.purchaseItem);
  app.post("/api/store/purchase/verify", [authJwt.verifyToken, rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "store-verify" })], controller.verifyEthPurchase);
  app.post("/api/store/equip", [authJwt.verifyToken], controller.equipItem);
  app.post("/api/store/gift", [authJwt.verifyToken, rateLimit({ max: 10, windowMs: 60_000, keyPrefix: "store-gift" })], controller.sendGift);

  app.post("/api/store/items", [authJwt.verifyToken, authJwt.isAdmin], controller.createItem);
  app.patch("/api/store/items/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.updateItem);
  app.delete("/api/store/items/:id", [authJwt.verifyToken, authJwt.isAdmin], controller.deleteItem);
};
