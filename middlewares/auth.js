/**
 * ============================================
 * MIDDLEWARE: Autenticación JWT
 * ============================================
 */

const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Middleware para verificar token JWT
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Extraer token (formato: "Bearer <token>")
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        error: 'Acceso denegado',
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Agregar usuario a la request
    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'El token ha expirado, por favor inicie sesión nuevamente'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }

    return res.status(500).json({
      error: 'Error de autenticación',
      message: error.message
    });
  }
};

/**
 * Middleware para verificar roles específicos
 * También considera roles basados en ligas (admin_liga, operador)
 */
const verificarRol = (...rolesPermitidos) => {
  return async (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'No autenticado',
        message: 'Debe estar autenticado para acceder a este recurso'
      });
    }

    // Verificar rol global (super_admin, admin, etc.)
    if (rolesPermitidos.includes(req.usuario.rol)) {
      return next();
    }

    // Verificar roles basados en ligas
    try {
      const { UsuarioLiga } = require('../models');
      const usuarioLigas = await UsuarioLiga.findAll({
        where: { usuario_id: req.usuario.id }
      });

      // Si el usuario tiene rol admin_liga en alguna liga y se requiere 'admin'
      if (rolesPermitidos.includes('admin')) {
        const esAdminLiga = usuarioLigas.some(ul => ul.rol_en_liga === 'admin_liga');
        if (esAdminLiga) {
          return next();
        }
      }

      // Si el usuario tiene rol operador en alguna liga y se requiere 'operador' o 'delegado'
      if (rolesPermitidos.includes('operador') || rolesPermitidos.includes('delegado')) {
        const esOperador = usuarioLigas.some(ul => ul.rol_en_liga === 'operador');
        if (esOperador) {
          return next();
        }
      }
    } catch (error) {
      console.error('Error verificando roles de liga:', error);
    }

    return res.status(403).json({
      error: 'Acceso denegado',
      message: `Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
    });
  };
};

/**
 * Middleware opcional - no falla si no hay token
 */
const tokenOpcional = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.findByPk(decoded.id);
      if (usuario && usuario.activo) {
        req.usuario = usuario;
      }
    }
  } catch (error) {
    // Ignorar errores y continuar sin usuario
  }
  next();
};

module.exports = {
  verificarToken,
  verificarRol,
  tokenOpcional
};
