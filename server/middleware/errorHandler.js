export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: "Internal server error",
  });

  // log full error details for debugging only, never in client response
  console.error(err);
};