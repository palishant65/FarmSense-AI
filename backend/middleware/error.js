export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
