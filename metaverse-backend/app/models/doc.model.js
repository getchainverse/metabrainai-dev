module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("docs", {
    basename: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    filepath: {
      type: Sequelize.STRING,
    },
    filename: {
      type: Sequelize.STRING,
    },
  });

  return User;
};
