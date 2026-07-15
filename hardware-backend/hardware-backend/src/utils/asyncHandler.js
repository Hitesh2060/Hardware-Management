/**
 * Wraps an async Express route handler so any thrown/rejected error is
 * forwarded to next(), landing in the centralized error middleware instead
 * of crashing the process or requiring a try/catch in every controller.
 */
const asyncHandler = (requestHandler) => (req, res, next) => {
  Promise.resolve(requestHandler(req, res, next)).catch(next);
};

export default asyncHandler;
