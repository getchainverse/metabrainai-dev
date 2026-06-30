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
    const items = await storeService.listItems(req.query);
    return res.status(200).send({ data: items });
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
      walletAddress: req.walletAddress || req.body.walletAddress,
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

exports.sendGift = async (req, res) => {
  try {
    const result = await storeService.sendGift({
      senderId: req.userId,
      receiverId: req.body.receiverId,
      productId: req.body.productId,
      message: req.body.message,
      transactionHash: req.body.txHash,
    });
    return res.status(201).send({ data: result });
  } catch (error) {
    return sendError(res, error);
  }
};
