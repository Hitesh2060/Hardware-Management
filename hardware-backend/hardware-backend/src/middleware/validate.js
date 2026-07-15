import ApiError from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    
    // Only overwrite body and params, not query (which is read-only)
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) req.params = parsed.params;
    // For query, we'll keep it as is since it's read-only
    
    next();
  } catch (err) {
    const errors = err.errors?.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    })) || [{ field: 'unknown', message: err.message }];
    
    next(ApiError.badRequest('Validation failed', errors));
  }
};