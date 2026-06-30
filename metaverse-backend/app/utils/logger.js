const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = () => LEVELS[process.env.LOG_LEVEL || "info"] ?? LEVELS.info;

const format = (level, message, meta = {}) => {
  const entry = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(entry);
};

const shouldLog = (level) => LEVELS[level] >= currentLevel();

const logger = {
  debug: (message, meta) => shouldLog("debug") && console.log(format("debug", message, meta)),
  info: (message, meta) => shouldLog("info") && console.log(format("info", message, meta)),
  warn: (message, meta) => shouldLog("warn") && console.warn(format("warn", message, meta)),
  error: (message, meta) => shouldLog("error") && console.error(format("error", message, meta)),
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    logger.info("request", {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
};

module.exports = {
  logger,
  requestLogger,
};
