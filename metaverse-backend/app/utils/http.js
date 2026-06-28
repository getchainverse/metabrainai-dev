const { logger } = require("./logger");

const sendError = (res, error, fallback = "Request failed.") => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    logger.error(fallback, { message: error.message, stack: error.stack });
  }
  return res.status(statusCode).send({
    message: error.message || fallback,
    errors: error.errors,
  });
};

module.exports = { sendError };
