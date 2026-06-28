const { randomUUID } = require("crypto");

const correlationId = (req, res, next) => {
  const id = req.headers["x-request-id"] || randomUUID();
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};

module.exports = correlationId;
