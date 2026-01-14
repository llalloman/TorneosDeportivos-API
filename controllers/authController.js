/**
 * ============================================
 * CONTROLADOR: Autenticación
 * ============================================
 */

const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');

/**
 * Generar JWT
 */
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
const registrar = asyncHandler(async (req, res) => {
  const { nombre, email, password, rol, telefono } = req.body;

  // Validar datos requeridos
  if (!nombre || !email || !password) {
    throw new AppError('Por favor proporcione nombre, email y contraseña', 400);
  }

  // Verificar si el email ya existe
  const usuarioExiste = await Usuario.findOne({ where: { email } });
  if (usuarioExiste) {
    throw new AppError('El email ya está registrado', 409);
  }

  // Crear usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    rol: rol || 'jugador',
    telefono
  });

  // Generar token
  const token = generarToken(usuario.id);

  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    data: {
      usuario: usuario.toJSON(),
      token
    }
  });
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validar datos
  if (!email || !password) {
    throw new AppError('Por favor proporcione email y contraseña', 400);
  }

  // Buscar usuario (incluir password para verificación)
  const usuario = await Usuario.findOne({ 
    where: { email },
    attributes: { include: ['password'] }
  });

  if (!usuario) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Verificar contraseña
  const passwordValido = await usuario.verificarPassword(password);
  if (!passwordValido) {
    throw new AppError('Credenciales inválidas', 401);
  }

  // Verificar si está activo
  if (!usuario.activo) {
    throw new AppError('La cuenta está desactivada', 403);
  }

  // Actualizar último acceso
  usuario.ultimo_acceso = new Date();
  await usuario.save();

  // Generar token
  const token = generarToken(usuario.id);

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      usuario: usuario.toJSON(),
      token
    }
  });
});

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
const obtenerPerfil = asyncHandler(async (req, res) => {
  const usuario = await Usuario.findByPk(req.usuario.id, {
    include: [
      { association: 'jugador', include: ['equipo'] },
      { association: 'arbitro' },
      { association: 'equipoDelegado' }
    ]
  });

  res.json({
    success: true,
    data: usuario
  });
});

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
const actualizarPerfil = asyncHandler(async (req, res) => {
  const { nombre, telefono, avatar } = req.body;

  const usuario = await Usuario.findByPk(req.usuario.id);

  if (nombre) usuario.nombre = nombre;
  if (telefono) usuario.telefono = telefono;
  if (avatar) usuario.avatar = avatar;

  await usuario.save();

  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: usuario
  });
});

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNuevo } = req.body;

  if (!passwordActual || !passwordNuevo) {
    throw new AppError('Por favor proporcione la contraseña actual y la nueva', 400);
  }

  // Obtener usuario con password
  const usuario = await Usuario.findByPk(req.usuario.id, {
    attributes: { include: ['password'] }
  });

  // Verificar contraseña actual
  const passwordValido = await usuario.verificarPassword(passwordActual);
  if (!passwordValido) {
    throw new AppError('La contraseña actual es incorrecta', 401);
  }

  // Actualizar contraseña
  usuario.password = passwordNuevo;
  await usuario.save();

  res.json({
    success: true,
    message: 'Contraseña actualizada exitosamente'
  });
});

/**
 * @route   GET /api/v1/auth/usuarios
 * @desc    Listar todos los usuarios (para admin)
 * @access  Private - Admin
 */
const listarUsuarios = asyncHandler(async (req, res) => {
  // Verificar que sea admin
  if (req.usuario.rol !== 'admin') {
    throw new AppError('No tiene permisos para acceder a este recurso', 403);
  }

  const usuarios = await Usuario.findAll({
    order: [['createdAt', 'DESC']],
    include: [
      { association: 'jugador', include: ['equipo'] },
      { association: 'arbitro' },
      { association: 'equipoDelegado' }
    ]
  });

  res.json({
    success: true,
    data: usuarios
  });
});

module.exports = {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  listarUsuarios
};
