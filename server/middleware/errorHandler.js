export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: 'Internal Server Error'
  });

  console.error(err);
};