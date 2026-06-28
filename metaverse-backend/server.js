const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieSession = require("cookie-session");
const helmet = require("helmet");

require("dotenv").config();

const env = require("./app/config/env");
const { requestLogger, logger } = require("./app/utils/logger");
const correlationId = require("./app/middleware/correlationId");
const rateLimit = require("./app/middleware/rateLimit");
const storeService = require("./app/services/store.service");

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: env.corsOrigins,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(correlationId);
app.use(requestLogger);
app.use(
  rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "global" })
);

app.use(
  cookieSession({
    name: "bezkoder-session",
    keys: [env.sessionSecret],
    httpOnly: true,
    sameSite: "strict",
  })
);

const db = require("./app/models");
const Role = db.role;

db.sequelize.sync().then(() => {
  initial();
});

app.get("/", (_req, res) => {
  res.json({ message: "MetaBrain AI Metaverse API", version: "1.0.0" });
});

app.get("/health", async (_req, res) => {
  try {
    await db.sequelize.query("SELECT 1");
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    logger.error("health check failed", { message: error.message });
    return res.status(503).json({ status: "error", database: "disconnected" });
  }
});

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/profile.routes")(app);
require("./app/routes/npc.routes")(app);
require("./app/routes/store.routes")(app);
require("./app/routes/social.routes")(app);
require("./app/routes/admin.routes")(app);
require("./app/routes/avatar.routes")(app);

const worldIo = require("./app/realtime/world.socket").attachWorldSocket(
  server,
  env.corsOrigins
);
require("./app/realtime/social.socket").attachSocialSocket(worldIo);

storeService
  .seedStore()
  .then(() => logger.info("store catalog seeded"))
  .catch((error) => logger.error("store seed failed", { message: error.message }));

server.listen(env.port, () => {
  logger.info("server started", { port: env.port });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("unhandled error", { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(env.nodeEnv === "development" && { stack: err.stack }),
  });
});

async function initial() {
  await Role.findOrCreate({ where: { id: 1 }, defaults: { id: 1, name: "sales" } });
  await Role.findOrCreate({ where: { id: 2 }, defaults: { id: 2, name: "vp" } });
  await Role.findOrCreate({ where: { id: 3 }, defaults: { id: 3, name: "admin" } });
  await Role.findOrCreate({ where: { id: 4 }, defaults: { id: 4, name: "level" } });
}
