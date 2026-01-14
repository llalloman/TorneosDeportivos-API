/**
 * ============================================
 * CONTROLADOR: Sanciones
 * ============================================
 */

const { Sancion, Jugador, Equipo, Partido } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/sanciones
 * @desc    Listar todas las sanciones
 * @access  Public
 */
const listarSanciones = asyncHandler(async (req, res) => {
  const { 
    jugador,
    equipo,
    tipo,
    activa,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};
  const includeJugador = {
    model: Jugador,
    as: 'jugador',
    attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'numero_camiseta', 'equipo_id'],
    include: []
  };

  if (jugador) where.jugador_id = jugador;
  if (tipo) where.tipo = tipo;
  if (activa !== undefined) where.activa = activa === 'true';

  // Filtro por equipo (a través del jugador)
  if (equipo) {
    includeJugador.where = { equipo_id: equipo };
    includeJugador.required = true;
  }

  const offset = (page - 1) * limit;

  const { count, rows: sanciones } = await Sancion.findAndCountAll({
    where,
    include: [
      {
        ...includeJugador,
        include: [
          {
            model: Equipo,
            as: 'equipo',
            attributes: ['id', 'nombre']
          }
        ]
      },
      {
        model: Partido,
        as: 'partido',
        attributes: ['id', 'fecha', 'equipo_local_id', 'equipo_visitante_id'],
        required: false
      }
    ],
    order: [['fecha_inicio', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      sanciones,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/sanciones/:id
 * @desc    Obtener sanción por ID
 * @access  Public
 */
const obtenerSancion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sancion = await Sancion.findByPk(id, {
    include: [
      {
        model: Jugador,
        as: 'jugador',
        attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'numero_camiseta'],
        include: [
          {
            model: Equipo,
            as: 'equipo',
            attributes: ['id', 'nombre']
          }
        ]
      },
      {
        model: Partido,
        as: 'partido',
        attributes: ['id', 'fecha', 'equipo_local_id', 'equipo_visitante_id'],
        required: false
      }
    ]
  });

  if (!sancion) {
    throw new AppError('Sanción no encontrada', 404);
  }

  res.json({
    success: true,
    data: sancion
  });
});

/**
 * @route   POST /api/v1/sanciones
 * @desc    Crear nueva sanción manualmente
 * @access  Private (Admin o Vocalia)
 */
const crearSancion = asyncHandler(async (req, res) => {
  const {
    jugador_id,
    partido_id,
    tipo,
    motivo,
    partidos_sancion,
    fecha_inicio,
    fecha_fin
  } = req.body;

  // Validaciones
  if (!jugador_id || !tipo || !motivo) {
    throw new AppError('jugador_id, tipo y motivo son requeridos', 400);
  }

  // Verificar que el jugador existe
  const jugador = await Jugador.findByPk(jugador_id);
  if (!jugador) {
    throw new AppError('Jugador no encontrado', 404);
  }

  // Si se proporciona partido_id, verificar que existe
  if (partido_id) {
    const partido = await Partido.findByPk(partido_id);
    if (!partido) {
      throw new AppError('Partido no encontrado', 404);
    }
  }

  const sancion = await Sancion.create({
    jugador_id,
    partido_id,
    tipo,
    motivo,
    partidos_sancion: partidos_sancion || 0,
    fecha_inicio: fecha_inicio || new Date(),
    fecha_fin,
    activa: true
  });

  // Actualizar estado del jugador
  if (partidos_sancion > 0) {
    await jugador.update({
      sancionado: true,
      partidos_sancion_restantes: partidos_sancion
    });
  }

  res.status(201).json({
    success: true,
    message: 'Sanción creada exitosamente',
    data: sancion
  });
});

/**
 * @route   PUT /api/v1/sanciones/:id
 * @desc    Actualizar sanción
 * @access  Private (Admin o Vocalia)
 */
const actualizarSancion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    tipo,
    motivo,
    partidos_sancion,
    fecha_fin,
    activa
  } = req.body;

  const sancion = await Sancion.findByPk(id, {
    include: [{ model: Jugador, as: 'jugador' }]
  });

  if (!sancion) {
    throw new AppError('Sanción no encontrada', 404);
  }

  // Actualizar campos
  if (tipo) sancion.tipo = tipo;
  if (motivo) sancion.motivo = motivo;
  if (partidos_sancion !== undefined) sancion.partidos_sancion = partidos_sancion;
  if (fecha_fin !== undefined) sancion.fecha_fin = fecha_fin;
  if (activa !== undefined) {
    sancion.activa = activa;
    
    // Si se desactiva la sanción, actualizar el jugador
    if (!activa && sancion.jugador) {
      await sancion.jugador.update({
        sancionado: false,
        partidos_sancion_restantes: 0
      });
    }
  }

  await sancion.save();

  res.json({
    success: true,
    message: 'Sanción actualizada exitosamente',
    data: sancion
  });
});

/**
 * @route   DELETE /api/v1/sanciones/:id
 * @desc    Eliminar sanción
 * @access  Private (Admin)
 */
const eliminarSancion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sancion = await Sancion.findByPk(id, {
    include: [{ model: Jugador, as: 'jugador' }]
  });

  if (!sancion) {
    throw new AppError('Sanción no encontrada', 404);
  }

  // Actualizar el jugador si la sanción estaba activa
  if (sancion.activa && sancion.jugador) {
    const sancionesActivas = await Sancion.count({
      where: {
        jugador_id: sancion.jugador_id,
        activa: true,
        id: { [Op.ne]: id }
      }
    });

    if (sancionesActivas === 0) {
      await sancion.jugador.update({
        sancionado: false,
        partidos_sancion_restantes: 0
      });
    }
  }

  await sancion.destroy();

  res.json({
    success: true,
    message: 'Sanción eliminada exitosamente'
  });
});

/**
 * @route   POST /api/v1/sanciones/:id/levantar
 * @desc    Levantar/finalizar sanción anticipadamente
 * @access  Private (Admin o Vocalia)
 */
const levantarSancion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { motivo_levantamiento } = req.body;

  const sancion = await Sancion.findByPk(id, {
    include: [{ model: Jugador, as: 'jugador' }]
  });

  if (!sancion) {
    throw new AppError('Sanción no encontrada', 404);
  }

  if (!sancion.activa) {
    throw new AppError('La sanción ya está inactiva', 400);
  }

  // Desactivar sanción
  sancion.activa = false;
  sancion.fecha_fin = new Date();
  if (motivo_levantamiento) {
    sancion.motivo = `${sancion.motivo} | LEVANTADA: ${motivo_levantamiento}`;
  }
  await sancion.save();

  // Verificar si el jugador tiene otras sanciones activas
  const sancionesActivas = await Sancion.count({
    where: {
      jugador_id: sancion.jugador_id,
      activa: true
    }
  });

  // Si no tiene más sanciones, desancionarlo
  if (sancionesActivas === 0 && sancion.jugador) {
    await sancion.jugador.update({
      sancionado: false,
      partidos_sancion_restantes: 0
    });
  }

  res.json({
    success: true,
    message: 'Sanción levantada exitosamente',
    data: sancion
  });
});

module.exports = {
  listarSanciones,
  obtenerSancion,
  crearSancion,
  actualizarSancion,
  eliminarSancion,
  levantarSancion
};
