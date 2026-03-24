export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : err.message || 'Request failed';

  res.status(status).json({
    error: message,
  });

  // log full error details for debugging only, never in client response
  console.error(err);
};