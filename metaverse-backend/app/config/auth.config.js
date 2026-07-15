module.exports = {
  // Use a strong secret from the environment in production.
  // Falls back to a dev-only value so the app still runs locally without a .env.
  secret: process.env.JWT_SECRET || "dev-only-insecure-secret-change-me"
};
