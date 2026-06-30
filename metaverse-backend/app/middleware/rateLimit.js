const buckets = new Map();

const rateLimit = ({ windowMs = 60_000, max = 60, keyPrefix = "global" } = {}) => (req, res, next) => {
  const key = `${keyPrefix}:${req.ip || "unknown"}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));

  if (bucket.count > max) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).send({
      message: "Too many requests. Please slow down.",
    });
  }

  return next();
};

module.exports = rateLimit;
