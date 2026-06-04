const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/user.model.js")(sequelize, Sequelize);
db.role = require("../models/role.model.js")(sequelize, Sequelize);
db.doc = require("../models/doc.model.js")(sequelize, Sequelize);
db.web = require("../models/web.model.js")(sequelize, Sequelize);

db.role.belongsToMany(db.user, {
  through: "user_roles",
});
db.user.belongsToMany(db.role, {
  through: "user_roles",
});
db.doc.belongsToMany(db.role, {
  through: "doc_roles",
});
db.role.belongsToMany(db.doc, {
  through: "doc_roles",
});
db.web.belongsToMany(db.role, {
  through: "web_roles",
});
db.role.belongsToMany(db.web, {
  through: "web_roles",
});

db.ROLES = ["level", "admin", "sales", "vp"];

module.exports = db;
