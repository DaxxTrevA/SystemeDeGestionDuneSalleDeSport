import { AppError } from './AppError.js';

export function notFound(req, res, next) {
  next(new AppError(`Route introuvable : ${req.method} ${req.path}`, 404));
}

export function errorHandler(error, req, res, next) {
  let status = error.statusCode || 500;
  let message = error.message || 'Une erreur interne est survenue.';
  let details = error.details;

  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Données invalides.';
    details = Object.values(error.errors).map(({ message: item }) => item);
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Identifiant invalide.';
  } else if (error.code === 11000) {
    status = 409;
    message = 'Cette adresse e-mail est déjà utilisée.';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}