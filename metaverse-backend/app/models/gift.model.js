module.exports = (sequelize, DataTypes) => {
  const Gift = sequelize.define("Gift", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER }, // null if just sending ETH
    amount: { type: DataTypes.DECIMAL(10, 4) }, // ETH amount
    message: { type: DataTypes.STRING },
    transactionHash: { type: DataTypes.STRING, unique: true }
  });
  return Gift;
};
