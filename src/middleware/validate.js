import { AppError } from '../utils/AppError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError('Données invalides.', 400, result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}