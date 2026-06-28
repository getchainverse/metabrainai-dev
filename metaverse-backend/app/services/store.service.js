const prisma = require("../prisma/client");

const DEFAULT_CATEGORIES = [
  { slug: "avatar", name: "Avatar", description: "Cosmetics and appearance upgrades." },
  { slug: "world", name: "World", description: "Decor and environment items." },
  { slug: "social", name: "Social", description: "Emotes and interaction items." },
];

const DEFAULT_ITEMS = [
  {
    sku: "hair-neon",
    name: "Neon Hair Pack",
    description: "A bright hairstyle upgrade.",
    categorySlug: "avatar",
    price: 120,
    ethPrice: "0.02",
    currency: "coins",
    thumbnailUrl: "/store/items/hair-neon.png",
    meta: { kind: "avatar", slot: "hairStyle", value: "curly" },
  },
  {
    sku: "outfit-street",
    name: "Street Outfit",
    description: "Urban clothes for everyday roaming.",
    categorySlug: "avatar",
    price: 180,
    ethPrice: "0.03",
    currency: "coins",
    thumbnailUrl: "/store/items/outfit-street.png",
    meta: { kind: "avatar", slot: "clothesStyle", value: "street" },
  },
  {
    sku: "glasses-visor",
    name: "Visor Glasses",
    description: "A sleek accessory for your avatar.",
    categorySlug: "social",
    price: 90,
    ethPrice: "0.015",
    currency: "coins",
    thumbnailUrl: "/store/items/glasses-visor.png",
    meta: { kind: "avatar", slot: "accessories", value: "glasses" },
  },
];

const seedStore = async () => {
  const categories = {};
  for (const category of DEFAULT_CATEGORIES) {
    const record = await prisma.storeCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
    categories[category.slug] = record;
  }

  for (const item of DEFAULT_ITEMS) {
    await prisma.storeItem.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        ethPrice: item.ethPrice,
        currency: item.currency,
        thumbnailUrl: item.thumbnailUrl,
        meta: item.meta,
        categoryId: categories[item.categorySlug].id,
      },
      create: {
        sku: item.sku,
        name: item.name,
        description: item.description,
        price: item.price,
        ethPrice: item.ethPrice,
        currency: item.currency,
        thumbnailUrl: item.thumbnailUrl,
        meta: item.meta,
        categoryId: categories[item.categorySlug].id,
      },
    });
  }
};

const validateStoreItem = (payload) => {
  const errors = {};
  const name = String(payload.name || "").trim();
  const sku = String(payload.sku || "").trim();
  const price = Number(payload.price);
  const ethPrice = String(payload.ethPrice || "").trim();

  if (!name) errors.name = "Item name is required.";
  if (!sku) errors.sku = "SKU is required.";
  if (!Number.isInteger(price) || price < 0) errors.price = "Price must be a non-negative integer.";
  if (!ethPrice || Number.isNaN(Number(ethPrice)) || Number(ethPrice) <= 0) {
    errors.ethPrice = "ETH price must be greater than zero.";
  }

  if (Object.keys(errors).length) {
    const error = new Error("Store item validation failed.");
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  return {
    name,
    sku,
    description: String(payload.description || "").trim(),
    price,
    currency: String(payload.currency || "coins").trim() || "coins",
    ethPrice,
    categoryId: payload.categoryId || null,
    thumbnailUrl: String(payload.thumbnailUrl || "").trim() || null,
    assetUrl: String(payload.assetUrl || "").trim() || null,
    meta: payload.meta && typeof payload.meta === "object" ? payload.meta : null,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  };
};

const listCategories = async () =>
  prisma.storeCategory.findMany({ include: { items: true }, orderBy: { name: "asc" } });

const listItems = async ({ categoryId, includeInactive = false } = {}) =>
  prisma.storeItem.findMany({
    where: {
      ...(categoryId ? { categoryId } : {}),
      ...(includeInactive ? {} : { isActive: true }),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

const createItem = async (payload) => {
  const input = validateStoreItem(payload);
  return prisma.storeItem.create({
    data: input,
    include: { category: true },
  });
};

const updateItem = async (id, payload) => {
  const existing = await prisma.storeItem.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Store item not found.");
    error.statusCode = 404;
    throw error;
  }

  const input = validateStoreItem({ ...existing, ...payload });
  return prisma.storeItem.update({
    where: { id },
    data: input,
    include: { category: true },
  });
};

const deleteItem = async (id) => {
  const existing = await prisma.storeItem.findUnique({ where: { id } });
  if (!existing) {
    const error = new Error("Store item not found.");
    error.statusCode = 404;
    throw error;
  }
  return prisma.storeItem.delete({ where: { id } });
};

const getInventory = async (userId) =>
  prisma.inventoryItem.findMany({
    where: { userId },
    include: { item: { include: { category: true } } },
    orderBy: { updatedAt: "desc" },
  });

const purchaseItem = async ({ userId, itemId, quantity = 1 }) => {
  const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
  if (!item || !item.isActive) {
    const error = new Error("Item not found.");
    error.statusCode = 404;
    throw error;
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    const error = new Error("Quantity must be at least 1.");
    error.statusCode = 400;
    throw error;
  }

  const total = item.price * qty;

  return prisma.$transaction(async (tx) => {
    const inventory = await tx.inventoryItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      update: { quantity: { increment: qty } },
      create: { userId, itemId, quantity: qty },
    });

    await tx.storeTransaction.create({
      data: {
        userId,
        itemId,
        type: "purchase",
        quantity: qty,
        amount: total,
        ethAmount: item.ethPrice,
        currency: item.currency,
      },
    });

    return { inventory, item, total };
  });
};

const equipItem = async ({ userId, itemId }) => {
  const inventory = await prisma.inventoryItem.findUnique({
    where: { userId_itemId: { userId, itemId } },
    include: { item: true },
  });

  if (!inventory || inventory.quantity < 1) {
    const error = new Error("You do not own this item.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.inventoryItem.updateMany({
    where: { userId },
    data: { isEquipped: false, equippedAt: null },
  });

  const equipped = await prisma.inventoryItem.update({
    where: { userId_itemId: { userId, itemId } },
    data: { isEquipped: true, equippedAt: new Date() },
    include: { item: { include: { category: true } } },
  });

  await prisma.storeTransaction.create({
    data: {
      userId,
      itemId,
      type: "equip",
      quantity: 1,
      amount: 0,
      currency: equipped.item.currency,
    },
  });

  return equipped;
};

const verifyEthPurchase = async ({ userId, walletAddress, itemId, txHash, chainId }) => {
  const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
  if (!item) {
    const error = new Error("Item not found.");
    error.statusCode = 404;
    throw error;
  }

  const rpcUrl = process.env.ETH_RPC_URL;
  const treasuryAddress = process.env.STORE_TREASURY_ADDRESS;
  if (!rpcUrl || !treasuryAddress) {
    const error = new Error("Blockchain configuration is incomplete.");
    error.statusCode = 500;
    throw error;
  }

  const { JsonRpcProvider, getAddress, formatEther } = require("ethers");
  const provider = new JsonRpcProvider(rpcUrl);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!receipt || receipt.status !== 1) {
    const error = new Error("Transaction was not confirmed.");
    error.statusCode = 400;
    throw error;
  }

  const transaction = await provider.getTransaction(txHash);
  if (!transaction) {
    const error = new Error("Transaction not found on chain.");
    error.statusCode = 404;
    throw error;
  }

  const normalizedFrom = getAddress(transaction.from);
  const normalizedWallet = getAddress(walletAddress);
  const normalizedTo = getAddress(treasuryAddress);
  if (normalizedFrom !== normalizedWallet) {
    const error = new Error("Transaction sender does not match wallet.");
    error.statusCode = 401;
    throw error;
  }
  if (!transaction.to || getAddress(transaction.to) !== normalizedTo) {
    const error = new Error("Transaction recipient does not match treasury.");
    error.statusCode = 400;
    throw error;
  }
  const expectedEth = String(item.ethPrice);
  const sentEth = formatEther(transaction.value);
  if (Number(sentEth) < Number(expectedEth)) {
    const error = new Error("Insufficient payment amount.");
    error.statusCode = 400;
    throw error;
  }

  const inventory = await prisma.inventoryItem.upsert({
    where: { userId_itemId: { userId, itemId } },
    update: { quantity: { increment: 1 } },
    create: { userId, itemId, quantity: 1 },
  });

  const tx = await prisma.storeTransaction.create({
    data: {
      userId,
      itemId,
      type: "eth_purchase",
      quantity: 1,
      amount: item.price,
      ethAmount: item.ethPrice,
      currency: "ETH",
      chainId: Number(chainId) || null,
      txHash,
      fromAddress: normalizedFrom,
      toAddress: normalizedTo,
      status: "confirmed",
      blockNumber: receipt.blockNumber,
      confirmedAt: new Date(),
    },
  });

  return { inventory, transaction: tx, item };
};

const getTransactions = async (userId) =>
  prisma.storeTransaction.findMany({
    where: { userId },
    include: { item: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

module.exports = {
  seedStore,
  listCategories,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  getInventory,
  purchaseItem,
  equipItem,
  verifyEthPurchase,
  getTransactions,
};
