/**
 * ============================================
 * CONTROLADOR: Árbitros
 * ============================================
 */

const { Arbitro, Usuario, Partido } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/arbitros
 * @desc    Listar todos los árbitros
 * @access  Public
 */
const listarArbitros = asyncHandler(async (req, res) => {
  const { 
    activo,
    search,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};

  if (activo !== undefined) where.activo = activo === 'true';
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { apellido_paterno: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows: arbitros } = await Arbitro.findAndCountAll({
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
      ['apellido_paterno', 'ASC'],
      ['nombre', 'ASC']
    ],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      arbitros,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/arbitros/:id
 * @desc    Obtener árbitro por ID
 * @access  Public
 */
const obtenerArbitro = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const arbitro = await Arbitro.findByPk(id, {
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'email', 'rol']
      },
      {
        model: Partido,
        as: 'partidos',
        attributes: ['id', 'fecha', 'equipo_local_id', 'equipo_visitante_id', 'estado'],
        limit: 10,
        order: [['fecha', 'DESC']]
      }
    ]
  });

  if (!arbitro) {
    throw new AppError('Árbitro no encontrado', 404);
  }

  res.json({
    success: true,
    data: arbitro
  });
});

/**
 * @route   POST /api/v1/arbitros
 * @desc    Crear nuevo árbitro
 * @access  Private (Admin)
 */
const crearArbitro = asyncHandler(async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    email,
    curp,
    usuario_id
  } = req.body;

  // Validaciones
  if (!nombre || !apellido_paterno) {
    throw new AppError('Nombre y apellido paterno son requeridos', 400);
  }

  // Si se proporciona usuario_id, verificar que existe y tiene rol árbitro
  if (usuario_id) {
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    if (usuario.rol !== 'arbitro' && usuario.rol !== 'admin') {
      throw new AppError('El usuario debe tener rol de árbitro o admin', 400);
    }

    // Verificar que el usuario no esté asignado a otro árbitro
    const usuarioAsignado = await Arbitro.findOne({
      where: { usuario_id }
    });
    if (usuarioAsignado) {
      throw new AppError('El usuario ya está asignado a otro árbitro', 409);
    }
  }

  // Verificar CURP único si se proporciona
  if (curp) {
    const curpExiste = await Arbitro.findOne({
      where: { curp: { [Op.iLike]: curp } }
    });
    if (curpExiste) {
      throw new AppError('El CURP ya está registrado', 409);
    }
  }

  const arbitro = await Arbitro.create({
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    email,
    curp,
    usuario_id,
    activo: true
  });

  res.status(201).json({
    success: true,
    message: 'Árbitro creado exitosamente',
    data: arbitro
  });
});

/**
 * @route   PUT /api/v1/arbitros/:id
 * @desc    Actualizar árbitro
 * @access  Private (Admin)
 */
const actualizarArbitro = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    telefono,
    email,
    activo
  } = req.body;

  const arbitro = await Arbitro.findByPk(id);

  if (!arbitro) {
    throw new AppError('Árbitro no encontrado', 404);
  }

  // Actualizar campos
  if (nombre) arbitro.nombre = nombre;
  if (apellido_paterno) arbitro.apellido_paterno = apellido_paterno;
  if (apellido_materno !== undefined) arbitro.apellido_materno = apellido_materno;
  if (telefono !== undefined) arbitro.telefono = telefono;
  if (email !== undefined) arbitro.email = email;
  if (activo !== undefined) arbitro.activo = activo;

  await arbitro.save();

  res.json({
    success: true,
    message: 'Árbitro actualizado exitosamente',
    data: arbitro
  });
});

/**
 * @route   DELETE /api/v1/arbitros/:id
 * @desc    Eliminar árbitro
 * @access  Private (Admin)
 */
const eliminarArbitro = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const arbitro = await Arbitro.findByPk(id, {
    include: [
      { model: Partido, as: 'partidos' }
    ]
  });

  if (!arbitro) {
    throw new AppError('Árbitro no encontrado', 404);
  }

  // Verificar si tiene partidos asignados
  if (arbitro.partidos && arbitro.partidos.length > 0) {
    throw new AppError('No se puede eliminar un árbitro con partidos asignados', 400);
  }

  await arbitro.destroy();

  res.json({
    success: true,
    message: 'Árbitro eliminado exitosamente'
  });
});

/**
 * @route   GET /api/v1/arbitros/:id/estadisticas
 * @desc    Obtener estadísticas del árbitro
 * @access  Public
 */
const obtenerEstadisticas = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const arbitro = await Arbitro.findByPk(id, {
    include: [
      {
        model: Partido,
        as: 'partidos',
        attributes: ['id', 'fecha', 'estado', 'goles_local', 'goles_visitante']
      }
    ]
  });

  if (!arbitro) {
    throw new AppError('Árbitro no encontrado', 404);
  }

  const partidosArbitrados = arbitro.partidos || [];
  const partidosFinalizados = partidosArbitrados.filter(p => p.estado === 'finalizado');

  const estadisticas = {
    arbitro: {
      id: arbitro.id,
      nombre: `${arbitro.nombre} ${arbitro.apellido_paterno} ${arbitro.apellido_materno || ''}`.trim()
    },
    partidos: {
      total_asignados: partidosArbitrados.length,
      finalizados: partidosFinalizados.length,
      pendientes: partidosArbitrados.filter(p => p.estado === 'programado').length,
      en_curso: partidosArbitrados.filter(p => p.estado === 'en_curso').length
    },
    goles: {
      total: partidosFinalizados.reduce((sum, p) => sum + (p.goles_local || 0) + (p.goles_visitante || 0), 0),
      promedio_por_partido: partidosFinalizados.length > 0
        ? (partidosFinalizados.reduce((sum, p) => sum + (p.goles_local || 0) + (p.goles_visitante || 0), 0) / partidosFinalizados.length).toFixed(2)
        : 0
    }
  };

  res.json({
    success: true,
    data: estadisticas
  });
});

module.exports = {
  listarArbitros,
  obtenerArbitro,
  crearArbitro,
  actualizarArbitro,
  eliminarArbitro,
  obtenerEstadisticas
};
