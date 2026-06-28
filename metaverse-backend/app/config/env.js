require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required in production.");
}

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || "bezkoder-secret-key",
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
  corsOrigins,
  logLevel: process.env.LOG_LEVEL || "info",
};
