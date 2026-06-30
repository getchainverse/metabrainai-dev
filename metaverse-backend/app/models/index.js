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
db.avatar = require("../models/avatar.model.js")(sequelize, Sequelize);
db.profile = require("../models/profile.model.js")(sequelize, Sequelize);
db.avatarCustomization = require("../models/avatar_customization.model.js")(sequelize, Sequelize);
db.product = require("../models/product.model.js")(sequelize, Sequelize);
db.inventory = require("../models/inventory.model.js")(sequelize, Sequelize);
db.order = require("../models/order.model.js")(sequelize, Sequelize);
db.gift = require("../models/gift.model.js")(sequelize, Sequelize);
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

db.user.hasOne(db.avatar, { foreignKey: "userId" });
db.avatar.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasOne(db.profile, { foreignKey: "userId" });
db.profile.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasOne(db.avatarCustomization, { foreignKey: "userId" });
db.avatarCustomization.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasMany(db.inventory, { foreignKey: "userId" });
db.inventory.belongsTo(db.user, { foreignKey: "userId" });

db.product.hasMany(db.inventory, { foreignKey: "productId" });
db.inventory.belongsTo(db.product, { foreignKey: "productId" });

db.user.hasMany(db.order, { foreignKey: "userId" });
db.order.belongsTo(db.user, { foreignKey: "userId" });

db.user.hasMany(db.gift, { foreignKey: "senderId", as: "SentGifts" });
db.user.hasMany(db.gift, { foreignKey: "receiverId", as: "ReceivedGifts" });
db.gift.belongsTo(db.user, { foreignKey: "senderId", as: "Sender" });
db.gift.belongsTo(db.user, { foreignKey: "receiverId", as: "Receiver" });

db.ROLES = ["level", "admin", "sales", "vp"];

module.exports = db;
