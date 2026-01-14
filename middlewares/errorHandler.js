/**
 * ============================================
 * MIDDLEWARE: Manejo Global de Errores
 * ============================================
 */

const logger = require('../utils/logger');

/**
 * Handler global de errores
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error(`Error: ${err.message}`);
  logger.error(err.stack);

  // Errores de validación de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errores = err.errors.map(e => ({
      campo: e.path,
      mensaje: e.message
    }));

    return res.status(400).json({
      error: 'Error de validación',
      detalles: errores
    });
  }

  // Errores de unicidad de Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const campo = err.errors[0]?.path || 'campo';
    return res.status(409).json({
      error: 'Conflicto de unicidad',
      message: `El ${campo} ya está registrado en el sistema`
    });
  }

  // Errores de foreign key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Error de referencia',
      message: 'La operación viola una restricción de integridad referencial'
    });
  }

  // Errores de conexión a la base de datos
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      error: 'Error de conexión',
      message: 'No se pudo conectar con la base de datos'
    });
  }

  // Error 404 - Not Found
  if (err.statusCode === 404) {
    return res.status(404).json({
      error: 'No encontrado',
      message: err.message || 'El recurso solicitado no existe'
    });
  }

  // Error 401 - Unauthorized
  if (err.statusCode === 401) {
    return res.status(401).json({
      error: 'No autorizado',
      message: err.message || 'Acceso no autorizado'
    });
  }

  // Error 403 - Forbidden
  if (err.statusCode === 403) {
    return res.status(403).json({
      error: 'Prohibido',
      message: err.message || 'No tiene permisos para realizar esta acción'
    });
  }

  // Error genérico del servidor
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: 'Error del servidor',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Ocurrió un error en el servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Wrapper para async/await en rutas
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Crear error personalizado
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  AppError
};
