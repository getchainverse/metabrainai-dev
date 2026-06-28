module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define("Product", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING, allowNull: false }, // 'clothing', 'accessory', 'furniture'
    subCategory: { type: DataTypes.STRING }, // 'hat', 'shirt'
    price: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
    currency: { type: DataTypes.STRING, defaultValue: "ETH" },
    rarity: { type: DataTypes.STRING, defaultValue: "common" },
    image: { type: DataTypes.STRING },
    model: { type: DataTypes.STRING },
    isNFT: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: { type: DataTypes.JSON, defaultValue: {} }
  });
  return Product;
};
