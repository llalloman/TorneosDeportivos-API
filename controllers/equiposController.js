/**
 * ============================================
 * CONTROLADOR: Equipos
 * ============================================
 */

const { Equipo, Torneo, Jugador, Usuario } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');
const db = require('../models');

/**
 * @route   GET /api/v1/equipos
 * @desc    Listar todos los equipos
 * @access  Public
 */
const listarEquipos = asyncHandler(async (req, res) => {
  const { 
    torneo,
    estado,
    search,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};

  if (torneo) where.torneo_id = torneo;
  if (estado) where.estado = estado;
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { delegado_nombre: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows: equipos } = await Equipo.findAndCountAll({
    where,
    include: [
      {
        model: Torneo,
        as: 'torneo',
        attributes: ['id', 'nombre', 'estado']
      },
      {
        model: Jugador,
        as: 'jugadores',
        attributes: ['id', 'nombre', 'apellido_paterno', 'numero_camiseta', 'posicion']
      }
    ],
    order: [['nombre', 'ASC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      equipos,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/equipos/:id
 * @desc    Obtener equipo por ID
 * @access  Public
 */
const obtenerEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipo = await Equipo.findByPk(id, {
    include: [
      {
        model: Torneo,
        as: 'torneo',
        attributes: ['id', 'nombre', 'estado', 'tipo']
      },
      {
        model: Jugador,
        as: 'jugadores',
        attributes: {
          exclude: ['created_at', 'updated_at']
        },
        order: [['numero_camiseta', 'ASC']]
      }
    ]
  });

  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  res.json({
    success: true,
    data: equipo
  });
});

/**
 * @route   POST /api/v1/equipos
 * @desc    Crear nuevo equipo
 * @access  Private (Admin)
 */
const crearEquipo = asyncHandler(async (req, res) => {
  const {
    nombre,
    torneo_id,
    escudo_url,
    delegado_nombre,
    delegado_telefono,
    delegado_email,
    delegado_usuario_id
  } = req.body;

  // Validaciones
  if (!nombre || !torneo_id) {
    throw new AppError('Nombre y torneo son requeridos', 400);
  }

  // Verificar que el torneo existe
  const torneo = await Torneo.findByPk(torneo_id);
  if (!torneo) {
    throw new AppError('Torneo no encontrado', 404);
  }

  // Verificar que no exista un equipo con el mismo nombre en el torneo
  const equipoExiste = await Equipo.findOne({
    where: {
      nombre: { [Op.iLike]: nombre },
      torneo_id
    }
  });

  if (equipoExiste) {
    throw new AppError('Ya existe un equipo con ese nombre en este torneo', 409);
  }

  // Si hay delegado_usuario_id, verificar que existe y tiene rol delegado
  if (delegado_usuario_id) {
    const usuario = await Usuario.findByPk(delegado_usuario_id);
    if (!usuario) {
      throw new AppError('Usuario delegado no encontrado', 404);
    }
    if (usuario.rol !== 'delegado' && usuario.rol !== 'admin') {
      throw new AppError('El usuario debe tener rol de delegado o admin', 400);
    }
  }

  const equipo = await Equipo.create({
    nombre,
    torneo_id,
    escudo_url,
    delegado_nombre,
    delegado_telefono,
    delegado_email,
    delegado_usuario_id,
    estado: 'activo',
    partidos_jugados: 0,
    partidos_ganados: 0,
    partidos_empatados: 0,
    partidos_perdidos: 0,
    puntos: 0,
    goles_favor: 0,
    goles_contra: 0,
    diferencia_goles: 0
  });

  // Incrementar contador de equipos en el torneo
  await torneo.increment('numero_equipos');

  res.status(201).json({
    success: true,
    message: 'Equipo creado exitosamente',
    data: equipo
  });
});

/**
 * @route   PUT /api/v1/equipos/:id
 * @desc    Actualizar equipo
 * @access  Private (Admin o Delegado del equipo)
 */
const actualizarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    escudo_url,
    delegado_nombre,
    delegado_telefono,
    delegado_email,
    estado
  } = req.body;

  const equipo = await Equipo.findByPk(id);

  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  // Verificar permisos: Admin o delegado del equipo
  if (req.usuario.rol !== 'admin') {
    if (req.usuario.rol !== 'delegado' || equipo.delegado_usuario_id !== req.usuario.id) {
      throw new AppError('No tiene permisos para actualizar este equipo', 403);
    }
  }

  // Si se cambia el nombre, verificar unicidad en el torneo
  if (nombre && nombre !== equipo.nombre) {
    const nombreExiste = await Equipo.findOne({
      where: {
        nombre: { [Op.iLike]: nombre },
        torneo_id: equipo.torneo_id,
        id: { [Op.ne]: id }
      }
    });

    if (nombreExiste) {
      throw new AppError('Ya existe otro equipo con ese nombre en este torneo', 409);
    }
  }

  // Actualizar campos
  if (nombre) equipo.nombre = nombre;
  if (escudo_url !== undefined) equipo.escudo_url = escudo_url;
  if (delegado_nombre) equipo.delegado_nombre = delegado_nombre;
  if (delegado_telefono !== undefined) equipo.delegado_telefono = delegado_telefono;
  if (delegado_email !== undefined) equipo.delegado_email = delegado_email;
  if (estado && req.usuario.rol === 'admin') equipo.estado = estado;

  await equipo.save();

  res.json({
    success: true,
    message: 'Equipo actualizado exitosamente',
    data: equipo
  });
});

/**
 * @route   DELETE /api/v1/equipos/:id
 * @desc    Eliminar equipo
 * @access  Private (Admin)
 */
const eliminarEquipo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipo = await Equipo.findByPk(id, {
    include: [
      { model: Jugador, as: 'jugadores' },
      { model: Torneo, as: 'torneo' }
    ]
  });

  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  // Verificar si tiene jugadores registrados
  if (equipo.jugadores && equipo.jugadores.length > 0) {
    throw new AppError('No se puede eliminar un equipo con jugadores registrados', 400);
  }

  // Decrementar contador de equipos en el torneo
  if (equipo.torneo) {
    await equipo.torneo.decrement('numero_equipos');
  }

  await equipo.destroy();

  res.json({
    success: true,
    message: 'Equipo eliminado exitosamente'
  });
});

/**
 * @route   GET /api/v1/equipos/:id/estadisticas
 * @desc    Obtener estadísticas detalladas del equipo
 * @access  Public
 */
const obtenerEstadisticas = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const equipo = await Equipo.findByPk(id, {
    include: [
      {
        model: Jugador,
        as: 'jugadores',
        attributes: [
          'id',
          'nombre',
          'apellido_paterno',
          'numero_camiseta',
          'posicion',
          'goles_totales',
          'tarjetas_amarillas',
          'tarjetas_rojas',
          'partidos_jugados',
          'sancionado'
        ],
        order: [['goles_totales', 'DESC']]
      }
    ]
  });

  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  // Calcular estadísticas adicionales
  const estadisticas = {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      puntos: equipo.puntos,
      partidos_jugados: equipo.partidos_jugados,
      victorias: equipo.partidos_ganados,
      empates: equipo.partidos_empatados,
      derrotas: equipo.partidos_perdidos,
      goles_favor: equipo.goles_favor,
      goles_contra: equipo.goles_contra,
      diferencia_goles: equipo.diferencia_goles
    },
    jugadores: equipo.jugadores,
    totales: {
      total_jugadores: equipo.jugadores.length,
      jugadores_sancionados: equipo.jugadores.filter(j => j.sancionado).length,
      goles_equipo: equipo.jugadores.reduce((sum, j) => sum + j.goles_totales, 0),
      tarjetas_amarillas: equipo.jugadores.reduce((sum, j) => sum + j.tarjetas_amarillas, 0),
      tarjetas_rojas: equipo.jugadores.reduce((sum, j) => sum + j.tarjetas_rojas, 0)
    }
  };

  res.json({
    success: true,
    data: estadisticas
  });
});

module.exports = {
  listarEquipos,
  obtenerEquipo,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
  obtenerEstadisticas
};
