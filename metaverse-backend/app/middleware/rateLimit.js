const rateLimit = require("express-rate-limit");

// Strict limiter for sensitive auth actions (login, signup, password reset).
// Limits repeated attempts from the same IP to mitigate brute-force and abuse.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many attempts. Please try again later.",
  },
});

module.exports = { authLimiter };
