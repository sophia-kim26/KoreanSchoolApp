export const errorHandler = (err, req, res, next) => {
  const status = err.status || res.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Server error',
  });
};
