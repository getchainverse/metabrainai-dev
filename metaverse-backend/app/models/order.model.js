module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    walletAddress: { type: DataTypes.STRING },
    items: { type: DataTypes.JSON, allowNull: false }, // Array of product IDs
    total: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
    transactionHash: { type: DataTypes.STRING, unique: true },
    status: { type: DataTypes.STRING, defaultValue: "pending" } // 'pending', 'completed', 'failed'
  });
  return Order;
};
