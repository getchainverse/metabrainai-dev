module.exports = (sequelize, DataTypes) => {
  const Inventory = sequelize.define("Inventory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    equipped: { type: DataTypes.BOOLEAN, defaultValue: false },
    obtainedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  });
  return Inventory;
};
