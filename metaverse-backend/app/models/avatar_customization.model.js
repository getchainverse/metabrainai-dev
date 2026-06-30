module.exports = (sequelize, Sequelize) => {
  const AvatarCustomization = sequelize.define("avatar_customizations", {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    hairStyle: Sequelize.STRING,
    hairColor: Sequelize.STRING,
    eyesStyle: Sequelize.STRING,
    eyesColor: Sequelize.STRING,
    bodyStyle: Sequelize.STRING,
    bodyColor: Sequelize.STRING,
    clothesStyle: Sequelize.STRING,
    clothesColor: Sequelize.STRING,
    accessories: Sequelize.JSON,
  });

  return AvatarCustomization;
};
