module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("users", {
    firstname: {
      type: Sequelize.STRING,
    },
    lastname: {
      type: Sequelize.STRING,
    },
    username: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    companyname: {
      type: Sequelize.STRING,
    },
    url: {
      type: Sequelize.STRING,
    },
    firstaddress: {
      type: Sequelize.STRING,
    },
    secondaddress: {
      type: Sequelize.STRING,
    },
    country: {
      type: Sequelize.STRING,
    },
    zipcode: {
      type: Sequelize.STRING,
    },
    phone: {
      type: Sequelize.STRING,
    },
    expiredTime: {
      type: Sequelize.STRING,
      defaultValue: "0",
    },
  });

  return User;
};
