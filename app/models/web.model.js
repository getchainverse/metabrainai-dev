module.exports = (sequelize, Sequelize) => {
  const Web = sequelize.define("webs", {
    path: {
      type: Sequelize.STRING,
    },
    index: {
      type: Sequelize.INTEGER,
    },
    basename: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
  });
  return Web;
};
