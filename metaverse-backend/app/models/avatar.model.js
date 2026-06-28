module.exports = (sequelize, Sequelize) => {
  const Avatar = sequelize.define("avatars", {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    presetName: {
      type: Sequelize.STRING,
      defaultValue: "Default Custom",
    },
    bodySettings: {
      type: Sequelize.JSON,
    },
    faceSettings: {
      type: Sequelize.JSON,
    },
    hairSettings: {
      type: Sequelize.JSON,
    },
    clothing: {
      type: Sequelize.JSON,
    },
    colors: {
      type: Sequelize.JSON,
    },
    equippedItems: {
      type: Sequelize.JSON,
    },
  });

  return Avatar;
};
