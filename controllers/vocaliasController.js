/**
 * ============================================
 * CONTROLADOR: Vocalías
 * ============================================
 */

const { Vocalia, Usuario } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/vocalias
 * @desc    Listar todas las vocalías
 * @access  Public
 */
const listarVocalias = asyncHandler(async (req, res) => {
  const { 
    activo,
    cargo,
    search,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};

  if (activo !== undefined) where.activo = activo === 'true';
  if (cargo) where.cargo = cargo;
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { apellido_paterno: { [Op.iLike]: `%${search}%` } },
      { cargo: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows: vocalias } = await Vocalia.findAndCountAll({
    where,
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'email', 'rol'],
        required: false
      }
    ],
    order: [
      ['cargo', 'ASC'],
      ['apellido_paterno', 'ASC']
    ],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      vocalias,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/vocalias/:id
 * @desc    Obtener vocalía por ID
 * @access  Public
 */
const obtenerVocalia = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vocalia = await Vocalia.findByPk(id, {
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'email', 'rol']
      }
    ]
  });

  if (!vocalia) {
    throw new AppError('Vocalía no encontrada', 404);
  }

  res.json({
    success: true,
    data: vocalia
  });
});

/**
 * @route   POST /api/v1/vocalias
 * @desc    Crear nueva vocalía
 * @access  Private (Admin)
 */
const crearVocalia = asyncHandler(async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    cargo,
    telefono,
    email,
    usuario_id
  } = req.body;

  // Validaciones
  if (!nombre || !apellido_paterno || !cargo) {
    throw new AppError('Nombre, apellido paterno y cargo son requeridos', 400);
  }

  // Si se proporciona usuario_id, verificar que existe y tiene rol vocalia
  if (usuario_id) {
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    if (usuario.rol !== 'vocalia' && usuario.rol !== 'admin') {
      throw new AppError('El usuario debe tener rol de vocalía o admin', 400);
    }

    // Verificar que el usuario no esté asignado a otra vocalía
    const usuarioAsignado = await Vocalia.findOne({
      where: { usuario_id }
    });
    if (usuarioAsignado) {
      throw new AppError('El usuario ya está asignado a otra vocalía', 409);
    }
  }

  const vocalia = await Vocalia.create({
    nombre,
    apellido_paterno,
    apellido_materno,
    cargo,
    telefono,
    email,
    usuario_id,
    activo: true
  });

  res.status(201).json({
    success: true,
    message: 'Vocalía creada exitosamente',
    data: vocalia
  });
});

/**
 * @route   PUT /api/v1/vocalias/:id
 * @desc    Actualizar vocalía
 * @access  Private (Admin)
 */
const actualizarVocalia = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    cargo,
    telefono,
    email,
    activo
  } = req.body;

  const vocalia = await Vocalia.findByPk(id);

  if (!vocalia) {
    throw new AppError('Vocalía no encontrada', 404);
  }

  // Actualizar campos
  if (nombre) vocalia.nombre = nombre;
  if (apellido_paterno) vocalia.apellido_paterno = apellido_paterno;
  if (apellido_materno !== undefined) vocalia.apellido_materno = apellido_materno;
  if (cargo) vocalia.cargo = cargo;
  if (telefono !== undefined) vocalia.telefono = telefono;
  if (email !== undefined) vocalia.email = email;
  if (activo !== undefined) vocalia.activo = activo;

  await vocalia.save();

  res.json({
    success: true,
    message: 'Vocalía actualizada exitosamente',
    data: vocalia
  });
});

/**
 * @route   DELETE /api/v1/vocalias/:id
 * @desc    Eliminar vocalía
 * @access  Private (Admin)
 */
const eliminarVocalia = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vocalia = await Vocalia.findByPk(id);

  if (!vocalia) {
    throw new AppError('Vocalía no encontrada', 404);
  }

  await vocalia.destroy();

  res.json({
    success: true,
    message: 'Vocalía eliminada exitosamente'
  });
});

module.exports = {
  listarVocalias,
  obtenerVocalia,
  crearVocalia,
  actualizarVocalia,
  eliminarVocalia
};
