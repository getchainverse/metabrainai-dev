module.exports = (sequelize, Sequelize) => {
  const Profile = sequelize.define("profiles", {
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    username: {
      type: Sequelize.STRING,
    },
    bio: {
      type: Sequelize.STRING,
    },
    avatar: {
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.STRING,
    },
  });

  return Profile;
};
