const db = require("../models");
const Product = db.product;
const Inventory = db.inventory;
const Order = db.order;
const Gift = db.gift;
const User = db.user;
const { ethers } = require("ethers");

const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0x0000000000000000000000000000000000000000";

const DEFAULT_ITEMS = [
  { name: "Neon Cyber Jacket", category: "clothing", subCategory: "jacket", price: 0.005, currency: "ETH", rarity: "epic", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200", metadata: { bodyColor: "hsl(180 100% 50%)" } },
  { name: "Golden Aviators", category: "accessory", subCategory: "glasses", price: 0.002, currency: "ETH", rarity: "rare", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=200" },
  { name: "Jetpack", category: "accessory", subCategory: "backpack", price: 0.015, currency: "ETH", rarity: "legendary", image: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=200" },
  { name: "Streetwear Hoodie", category: "clothing", subCategory: "shirt", price: 0.001, currency: "ETH", rarity: "common", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200" },
  { name: "Diamond Crown", category: "accessory", subCategory: "hat", price: 0.05, currency: "ETH", rarity: "legendary", image: "https://images.unsplash.com/photo-1589647363585-f4a7d38bfc58?q=80&w=200" }
];

const seedStore = async () => {
  const count = await Product.count();
  if (count === 0) {
    await Product.bulkCreate(DEFAULT_ITEMS);
  }
};

const listCategories = async () => {
  return [
    { slug: "clothing", name: "Clothing" },
    { slug: "accessory", name: "Accessory" },
    { slug: "furniture", name: "Furniture" }
  ];
};

const listItems = async (filters = {}) => {
  return await Product.findAll();
};

const getInventory = async (userId) => {
  return await Inventory.findAll({
    where: { userId },
    include: [{ model: Product }]
  });
};

const purchaseItem = async ({ userId, itemId, quantity = 1 }) => {
  // Simple off-chain purchase for free/mock items if needed
  const product = await Product.findByPk(itemId);
  if (!product) throw new Error("Item not found");

  const existing = await Inventory.findOne({ where: { userId, productId: itemId } });
  if (existing) throw new Error("You already own this item.");

  const inventory = await Inventory.create({ userId, productId: itemId, equipped: false });
  return { inventory, item: product };
};

const verifyEthPurchase = async ({ userId, walletAddress, itemId, txHash, chainId }) => {
  const product = await Product.findByPk(itemId);
  if (!product) throw new Error("Item not found.");

  const existing = await Inventory.findOne({ where: { userId, productId: itemId } });
  if (existing) throw new Error("You already own this item.");

  try {
    if (!txHash) throw new Error("Transaction hash is required.");
    const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
    const tx = await provider.getTransaction(txHash);
    if (!tx) throw new Error("Transaction not found on chain.");
    
    const receipt = await tx.wait();
    if (receipt.status !== 1) throw new Error("Transaction failed on chain.");

    if (tx.to.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
      throw new Error("Transaction was not sent to the treasury address.");
    }
    
    const requiredValue = ethers.parseEther(product.price.toString());
    if (tx.value < requiredValue) {
      throw new Error("Transaction value is less than product price.");
    }
  } catch (err) {
    const error = new Error("Transaction verification failed: " + err.message);
    error.statusCode = 400;
    throw error;
  }

  // Create order ledger
  await Order.create({
    userId,
    walletAddress: walletAddress || "unknown",
    items: [itemId],
    total: product.price,
    transactionHash: txHash,
    status: "completed"
  });

  // Grant inventory
  const inventory = await Inventory.create({
    userId,
    productId: itemId,
    equipped: false
  });

  return { inventory, item: product };
};

const equipItem = async ({ userId, itemId }) => {
  const inventory = await Inventory.findOne({ where: { userId, productId: itemId } });
  if (!inventory) throw new Error("You do not own this item.");

  // Unequip similar category items (not fully implemented here, just equip)
  await inventory.update({ equipped: true });
  return inventory;
};

const getTransactions = async (userId) => {
  return await Order.findAll({ where: { userId } });
};

const sendGift = async ({ senderId, receiverId, productId, message, transactionHash }) => {
  const receiver = await User.findByPk(receiverId);
  if (!receiver) throw new Error("Receiver not found.");

  // Similar validation to verifyEthPurchase would go here
  if (productId) {
    const product = await Product.findByPk(productId);
    if (!product) throw new Error("Product not found.");

    await Inventory.create({ userId: receiverId, productId, equipped: false });
  }

  const gift = await Gift.create({
    senderId,
    receiverId,
    productId,
    message,
    transactionHash
  });

  return gift;
};

module.exports = {
  seedStore,
  listCategories,
  listItems,
  getInventory,
  purchaseItem,
  verifyEthPurchase,
  equipItem,
  getTransactions,
  sendGift
};
