module.exports = {
  HOST: "localhost",
  PORT: "3306",
  USER: "root",
  DB: "metaverse",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
