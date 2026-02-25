function notFound(req, res) {
  res.status(404).json({ message: `Not found: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({ message: err.message || 'Server error' });
}

module.exports = { notFound, errorHandler };
