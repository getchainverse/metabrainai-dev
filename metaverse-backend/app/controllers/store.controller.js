const storeService = require("../services/store.service");
const { sendError } = require("../utils/http");

exports.listCategories = async (_req, res) => {
  try {
    const categories = await storeService.listCategories();
    return res.status(200).send({ data: categories });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.listItems = async (req, res) => {
  try {
    const items = await storeService.listItems({
      categoryId: req.query.categoryId,
      includeInactive: req.query.includeInactive === "true",
    });
    return res.status(200).send({ data: items });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.createItem = async (req, res) => {
  try {
    const item = await storeService.createItem(req.body);
    return res.status(201).send({ data: item });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await storeService.updateItem(req.params.id, req.body);
    return res.status(200).send({ data: item });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await storeService.deleteItem(req.params.id);
    return res.status(200).send({ data: item });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getInventory = async (req, res) => {
  try {
    const inventory = await storeService.getInventory(req.userId);
    return res.status(200).send({ data: inventory });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.purchaseItem = async (req, res) => {
  try {
    const result = await storeService.purchaseItem({
      userId: req.userId,
      itemId: req.body.itemId,
      quantity: req.body.quantity,
    });
    return res.status(201).send({ data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.equipItem = async (req, res) => {
  try {
    const inventoryItem = await storeService.equipItem({
      userId: req.userId,
      itemId: req.body.itemId,
    });
    return res.status(200).send({ data: inventoryItem });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.verifyEthPurchase = async (req, res) => {
  try {
    const result = await storeService.verifyEthPurchase({
      userId: req.userId,
      walletAddress: req.walletAddress,
      itemId: req.body.itemId,
      txHash: req.body.txHash,
      chainId: req.body.chainId,
    });
    return res.status(201).send({ data: result });
  } catch (error) {
    return sendError(res, error);
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await storeService.getTransactions(req.userId);
    return res.status(200).send({ data: transactions });
  } catch (error) {
    return sendError(res, error);
  }
};
