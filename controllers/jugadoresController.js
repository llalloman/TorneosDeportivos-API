/**
 * ============================================
 * CONTROLADOR: Jugadores
 * ============================================
 */

const { Jugador, Equipo, Torneo, Sancion, Multa, Tarjeta } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');
const db = require('../models');

/**
 * @route   GET /api/v1/jugadores
 * @desc    Listar todos los jugadores
 * @access  Public
 */
const listarJugadores = asyncHandler(async (req, res) => {
  const { 
    equipo,
    torneo,
    posicion,
    sancionado,
    search,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};
  const includeEquipo = {
    model: Equipo,
    as: 'equipo',
    attributes: ['id', 'nombre', 'torneo_id'],
    include: []
  };

  if (equipo) where.equipo_id = equipo;
  if (posicion) where.posicion = posicion;
  if (sancionado !== undefined) where.sancionado = sancionado === 'true';
  
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { apellido_paterno: { [Op.iLike]: `%${search}%` } },
      { apellido_materno: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Filtro por torneo (a través del equipo)
  if (torneo) {
    includeEquipo.where = { torneo_id: torneo };
    includeEquipo.required = true;
  }

  const offset = (page - 1) * limit;

  const { count, rows: jugadores } = await Jugador.findAndCountAll({
    where,
    include: [includeEquipo],
    order: [
      ['apellido_paterno', 'ASC'],
      ['apellido_materno', 'ASC'],
      ['nombre', 'ASC']
    ],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      jugadores,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/jugadores/:id
 * @desc    Obtener jugador por ID con detalles
 * @access  Public
 */
const obtenerJugador = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jugador = await Jugador.findByPk(id, {
    include: [
      {
        model: Equipo,
        as: 'equipo',
        attributes: ['id', 'nombre', 'torneo_id'],
        include: [
          {
            model: Torneo,
            as: 'torneo',
            attributes: ['id', 'nombre', 'estado']
          }
        ]
      },
      {
        model: Sancion,
        as: 'sanciones',
        where: { activa: true },
        required: false,
        order: [['fecha_inicio', 'DESC']]
      },
      {
        model: Multa,
        as: 'multas',
        where: { pagada: false },
        required: false,
        order: [['fecha_emision', 'DESC']]
      }
    ]
  });

  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  res.json({
    success: true,
    data: jugador
  });
});

/**
 * @route   POST /api/v1/jugadores
 * @desc    Crear nuevo jugador
 * @access  Private (Admin o Delegado)
 */
const crearJugador = asyncHandler(async (req, res) => {
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    curp,
    equipo_id,
    numero_camiseta,
    posicion,
    foto_url
  } = req.body;

  // Validaciones
  if (!nombre || !apellido_paterno || !equipo_id || !numero_camiseta || !posicion) {
    throw new AppError('Campos requeridos: nombre, apellido_paterno, equipo_id, numero_camiseta, posicion', 400);
  }

  // Verificar que el equipo existe
  const equipo = await Equipo.findByPk(equipo_id);
  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  // Verificar permisos: Admin o Delegado del equipo
  if (req.usuario.rol !== 'admin') {
    if (req.usuario.rol !== 'delegado' || equipo.delegado_usuario_id !== req.usuario.id) {
      throw new AppError('No tiene permisos para agregar jugadores a este equipo', 403);
    }
  }

  // Verificar que el número de camiseta no esté ocupado en el equipo
  const numeroCamisetaExiste = await Jugador.findOne({
    where: {
      equipo_id,
      numero_camiseta
    }
  });

  if (numeroCamisetaExiste) {
    throw new AppError(`El número de camiseta ${numero_camiseta} ya está ocupado en este equipo`, 409);
  }

  // Verificar CURP único si se proporciona
  if (curp) {
    const curpExiste = await Jugador.findOne({
      where: { curp: { [Op.iLike]: curp } }
    });

    if (curpExiste) {
      throw new AppError('El CURP ya está registrado', 409);
    }
  }

  const jugador = await Jugador.create({
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    curp,
    equipo_id,
    numero_camiseta,
    posicion,
    foto_url,
    goles_totales: 0,
    asistencias_totales: 0,
    tarjetas_amarillas: 0,
    tarjetas_rojas: 0,
    partidos_jugados: 0,
    sancionado: false,
    partidos_sancion_restantes: 0
  });

  res.status(201).json({
    success: true,
    message: 'Jugador creado exitosamente',
    data: jugador
  });
});

/**
 * @route   PUT /api/v1/jugadores/:id
 * @desc    Actualizar jugador
 * @access  Private (Admin o Delegado del equipo)
 */
const actualizarJugador = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido_paterno,
    apellido_materno,
    fecha_nacimiento,
    numero_camiseta,
    posicion,
    foto_url
  } = req.body;

  const jugador = await Jugador.findByPk(id, {
    include: [{ model: Equipo, as: 'equipo' }]
  });

  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  // Verificar permisos
  if (req.usuario.rol !== 'admin') {
    if (req.usuario.rol !== 'delegado' || jugador.equipo.delegado_usuario_id !== req.usuario.id) {
      throw new AppError('No tiene permisos para actualizar este jugador', 403);
    }
  }

  // Si se cambia el número de camiseta, verificar que no esté ocupado
  if (numero_camiseta && numero_camiseta !== jugador.numero_camiseta) {
    const numeroCamisetaExiste = await Jugador.findOne({
      where: {
        equipo_id: jugador.equipo_id,
        numero_camiseta,
        id: { [Op.ne]: id }
      }
    });

    if (numeroCamisetaExiste) {
      throw new AppError(`El número de camiseta ${numero_camiseta} ya está ocupado en este equipo`, 409);
    }
  }

  // Actualizar campos
  if (nombre) jugador.nombre = nombre;
  if (apellido_paterno) jugador.apellido_paterno = apellido_paterno;
  if (apellido_materno !== undefined) jugador.apellido_materno = apellido_materno;
  if (fecha_nacimiento) jugador.fecha_nacimiento = fecha_nacimiento;
  if (numero_camiseta) jugador.numero_camiseta = numero_camiseta;
  if (posicion) jugador.posicion = posicion;
  if (foto_url !== undefined) jugador.foto_url = foto_url;

  await jugador.save();

  res.json({
    success: true,
    message: 'Jugador actualizado exitosamente',
    data: jugador
  });
});

/**
 * @route   DELETE /api/v1/jugadores/:id
 * @desc    Eliminar jugador
 * @access  Private (Admin)
 */
const eliminarJugador = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jugador = await Jugador.findByPk(id, {
    include: [
      { model: Tarjeta, as: 'tarjetas' },
      { model: Sancion, as: 'sanciones' },
      { model: Multa, as: 'multas' }
    ]
  });

  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  // Verificar si tiene registros relacionados
  if (jugador.partidos_jugados > 0) {
    throw new AppError('No se puede eliminar un jugador con partidos jugados', 400);
  }

  await jugador.destroy();

  res.json({
    success: true,
    message: 'Jugador eliminado exitosamente'
  });
});

/**
 * @route   GET /api/v1/jugadores/:id/estado
 * @desc    Verificar estado de habilitación del jugador
 * @access  Public
 */
const verificarEstado = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jugador = await Jugador.findByPk(id, {
    include: [
      {
        model: Sancion,
        as: 'sanciones',
        where: { activa: true },
        required: false
      },
      {
        model: Multa,
        as: 'multas',
        where: { pagada: false },
        required: false
      }
    ]
  });

  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  const multasPendientes = jugador.multas || [];
  const sancionesActivas = jugador.sanciones || [];

  const estado = {
    habilitado: !jugador.sancionado && multasPendientes.length === 0,
    sancionado: jugador.sancionado,
    partidos_sancion_restantes: jugador.partidos_sancion_restantes,
    multas_pendientes: multasPendientes.length,
    monto_total_multas: multasPendientes.reduce((sum, m) => sum + parseFloat(m.monto), 0),
    detalles: {
      sanciones: sancionesActivas.map(s => ({
        id: s.id,
        tipo: s.tipo,
        motivo: s.motivo,
        partidos_sancion: s.partidos_sancion,
        fecha_inicio: s.fecha_inicio,
        fecha_fin: s.fecha_fin
      })),
      multas: multasPendientes.map(m => ({
        id: m.id,
        monto: m.monto,
        motivo: m.motivo,
        fecha_emision: m.fecha_emision,
        fecha_limite_pago: m.fecha_limite_pago
      }))
    }
  };

  res.json({
    success: true,
    data: estado
  });
});

/**
 * @route   GET /api/v1/jugadores/:id/estadisticas
 * @desc    Obtener estadísticas detalladas del jugador
 * @access  Public
 */
const obtenerEstadisticas = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const jugador = await Jugador.findByPk(id, {
    include: [
      {
        model: Equipo,
        as: 'equipo',
        attributes: ['id', 'nombre']
      },
      {
        model: Tarjeta,
        as: 'tarjetas',
        include: [
          {
            model: db.Partido,
            as: 'partido',
            attributes: ['id', 'fecha', 'equipo_local_id', 'equipo_visitante_id']
          }
        ]
      }
    ]
  });

  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  const estadisticas = {
    jugador: {
      id: jugador.id,
      nombre: `${jugador.nombre} ${jugador.apellido_paterno} ${jugador.apellido_materno || ''}`.trim(),
      numero_camiseta: jugador.numero_camiseta,
      posicion: jugador.posicion,
      equipo: jugador.equipo?.nombre
    },
    rendimiento: {
      partidos_jugados: jugador.partidos_jugados,
      goles_totales: jugador.goles_totales,
      asistencias_totales: jugador.asistencias_totales,
      promedio_goles: jugador.partidos_jugados > 0 
        ? (jugador.goles_totales / jugador.partidos_jugados).toFixed(2)
        : 0
    },
    disciplina: {
      tarjetas_amarillas: jugador.tarjetas_amarillas,
      tarjetas_rojas: jugador.tarjetas_rojas,
      sancionado: jugador.sancionado,
      partidos_sancion_restantes: jugador.partidos_sancion_restantes
    },
    historial_tarjetas: jugador.tarjetas.map(t => ({
      tipo: t.tipo,
      minuto: t.minuto,
      motivo: t.motivo,
      partido_id: t.partido_id,
      fecha: t.partido?.fecha
    }))
  };

  res.json({
    success: true,
    data: estadisticas
  });
});

module.exports = {
  listarJugadores,
  obtenerJugador,
  crearJugador,
  actualizarJugador,
  eliminarJugador,
  verificarEstado,
  obtenerEstadisticas
};
