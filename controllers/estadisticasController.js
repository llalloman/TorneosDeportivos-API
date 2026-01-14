/**
 * ============================================
 * CONTROLADOR: Estadísticas
 * ============================================
 */

const { Torneo, Equipo, Jugador, Partido, Goleador, Tarjeta, Sancion, Multa } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');
const db = require('../models');

/**
 * @route   GET /api/v1/estadisticas/goleadores
 * @desc    Obtener tabla de goleadores
 * @access  Public
 */
const obtenerGoleadores = asyncHandler(async (req, res) => {
  const { torneo, limit = 20 } = req.query;

  const where = {};
  const includeJugador = {
    model: Jugador,
    as: 'jugador',
    attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'numero_camiseta', 'posicion', 'equipo_id'],
    include: []
  };

  // Filtro por torneo
  if (torneo) {
    includeJugador.include.push({
      model: Equipo,
      as: 'equipo',
      where: { torneo_id: torneo },
      attributes: ['id', 'nombre'],
      required: true
    });
    includeJugador.required = true;
  } else {
    includeJugador.include.push({
      model: Equipo,
      as: 'equipo',
      attributes: ['id', 'nombre']
    });
  }

  // Agrupar goleadores y contar goles
  const goleadores = await Goleador.findAll({
    where,
    attributes: [
      'jugador_id',
      [db.sequelize.fn('COUNT', db.sequelize.col('Goleador.id')), 'goles']
    ],
    include: [includeJugador],
    group: ['jugador_id', 'jugador.id', 'jugador.nombre', 'jugador.apellido_paterno', 'jugador.apellido_materno', 'jugador.numero_camiseta', 'jugador.posicion', 'jugador.equipo_id', 'jugador->equipo.id', 'jugador->equipo.nombre'],
    order: [[db.sequelize.literal('goles'), 'DESC']],
    limit: parseInt(limit),
    subQuery: false
  });

  res.json({
    success: true,
    data: goleadores
  });
});

/**
 * @route   GET /api/v1/estadisticas/tarjetas
 * @desc    Obtener estadísticas de tarjetas por torneo
 * @access  Public
 */
const obtenerEstadisticasTarjetas = asyncHandler(async (req, res) => {
  const { torneo } = req.query;

  if (!torneo) {
    throw new AppError('El parámetro torneo es requerido', 400);
  }

  // Tarjetas por tipo
  const tarjetasPorTipo = await Tarjeta.findAll({
    attributes: [
      'tipo',
      [db.sequelize.fn('COUNT', db.sequelize.col('Tarjeta.id')), 'total']
    ],
    include: [
      {
        model: Partido,
        as: 'partido',
        attributes: [],
        include: [
          {
            model: Torneo,
            as: 'torneo',
            where: { id: torneo },
            attributes: []
          }
        ]
      }
    ],
    group: ['tipo'],
    raw: true
  });

  // Top jugadores con más tarjetas
  const jugadoresConMasTarjetas = await Jugador.findAll({
    attributes: [
      'id',
      'nombre',
      'apellido_paterno',
      'apellido_materno',
      'numero_camiseta',
      'tarjetas_amarillas',
      'tarjetas_rojas',
      [
        db.sequelize.literal('tarjetas_amarillas + (tarjetas_rojas * 2)'),
        'puntos_tarjetas'
      ]
    ],
    include: [
      {
        model: Equipo,
        as: 'equipo',
        where: { torneo_id: torneo },
        attributes: ['id', 'nombre']
      }
    ],
    order: [[db.sequelize.literal('puntos_tarjetas'), 'DESC']],
    limit: 10
  });

  // Equipos con más tarjetas
  const equiposConMasTarjetas = await Equipo.findAll({
    attributes: [
      'id',
      'nombre'
    ],
    where: { torneo_id: torneo },
    include: [
      {
        model: Jugador,
        as: 'jugadores',
        attributes: []
      }
    ],
    group: ['Equipo.id'],
    order: [[db.sequelize.literal('SUM(jugadores.tarjetas_amarillas + jugadores.tarjetas_rojas)'), 'DESC']],
    limit: 10,
    subQuery: false,
    raw: true
  });

  res.json({
    success: true,
    data: {
      resumen: tarjetasPorTipo,
      jugadores: jugadoresConMasTarjetas,
      equipos: equiposConMasTarjetas
    }
  });
});

/**
 * @route   GET /api/v1/estadisticas/general
 * @desc    Obtener estadísticas generales del sistema
 * @access  Public
 */
const obtenerEstadisticasGenerales = asyncHandler(async (req, res) => {
  const { torneo } = req.query;

  const whereEquipo = torneo ? { torneo_id: torneo } : {};
  const whereTorneo = torneo ? { id: torneo } : {};

  const [
    totalTorneos,
    totalEquipos,
    totalJugadores,
    totalPartidos,
    totalGoles,
    totalTarjetasAmarillas,
    totalTarjetasRojas,
    totalSancionesActivas,
    totalMultasPendientes
  ] = await Promise.all([
    Torneo.count({ where: whereTorneo }),
    Equipo.count({ where: whereEquipo }),
    Jugador.count({
      include: torneo ? [{
        model: Equipo,
        as: 'equipo',
        where: { torneo_id: torneo },
        attributes: []
      }] : []
    }),
    Partido.count({
      include: torneo ? [{
        model: Torneo,
        as: 'torneo',
        where: { id: torneo },
        attributes: []
      }] : []
    }),
    Jugador.sum('goles_totales', {
      include: torneo ? [{
        model: Equipo,
        as: 'equipo',
        where: { torneo_id: torneo },
        attributes: []
      }] : []
    }),
    Jugador.sum('tarjetas_amarillas', {
      include: torneo ? [{
        model: Equipo,
        as: 'equipo',
        where: { torneo_id: torneo },
        attributes: []
      }] : []
    }),
    Jugador.sum('tarjetas_rojas', {
      include: torneo ? [{
        model: Equipo,
        as: 'equipo',
        where: { torneo_id: torneo },
        attributes: []
      }] : []
    }),
    Sancion.count({ where: { activa: true } }),
    Multa.count({ where: { pagada: false } })
  ]);

  const estadisticas = {
    torneos: totalTorneos || 0,
    equipos: totalEquipos || 0,
    jugadores: totalJugadores || 0,
    partidos: {
      total: totalPartidos || 0
    },
    goles: {
      total: parseInt(totalGoles) || 0,
      promedio_por_partido: totalPartidos > 0 ? ((totalGoles || 0) / totalPartidos).toFixed(2) : 0
    },
    disciplina: {
      tarjetas_amarillas: parseInt(totalTarjetasAmarillas) || 0,
      tarjetas_rojas: parseInt(totalTarjetasRojas) || 0,
      sanciones_activas: totalSancionesActivas || 0,
      multas_pendientes: totalMultasPendientes || 0
    }
  };

  res.json({
    success: true,
    data: estadisticas
  });
});

/**
 * @route   GET /api/v1/estadisticas/rendimiento/:equipoId
 * @desc    Obtener estadísticas de rendimiento de un equipo
 * @access  Public
 */
const obtenerRendimientoEquipo = asyncHandler(async (req, res) => {
  const { equipoId } = req.params;

  const equipo = await Equipo.findByPk(equipoId, {
    include: [
      {
        model: Jugador,
        as: 'jugadores',
        attributes: ['id', 'nombre', 'apellido_paterno', 'goles_totales', 'asistencias_totales', 'partidos_jugados']
      }
    ]
  });

  if (!equipo) {
    throw new AppError('Equipo no encontrado', 404);
  }

  // Últimos 5 partidos
  const ultimosPartidos = await Partido.findAll({
    where: {
      [Op.or]: [
        { equipo_local_id: equipoId },
        { equipo_visitante_id: equipoId }
      ],
      estado: 'finalizado'
    },
    include: [
      {
        model: Equipo,
        as: 'equipoLocal',
        attributes: ['id', 'nombre']
      },
      {
        model: Equipo,
        as: 'equipoVisitante',
        attributes: ['id', 'nombre']
      }
    ],
    order: [['fecha', 'DESC']],
    limit: 5
  });

  // Calcular racha
  const racha = ultimosPartidos.map(p => {
    const esLocal = p.equipo_local_id === parseInt(equipoId);
    const golesAFavor = esLocal ? p.goles_local : p.goles_visitante;
    const golesEnContra = esLocal ? p.goles_visitante : p.goles_local;

    if (golesAFavor > golesEnContra) return 'V';
    if (golesAFavor < golesEnContra) return 'D';
    return 'E';
  });

  const rendimiento = {
    equipo: {
      id: equipo.id,
      nombre: equipo.nombre,
      puntos: equipo.puntos,
      partidos_jugados: equipo.partidos_jugados,
      victorias: equipo.partidos_ganados,
      empates: equipo.partidos_empatados,
      derrotas: equipo.partidos_perdidos
    },
    goles: {
      favor: equipo.goles_favor,
      contra: equipo.goles_contra,
      diferencia: equipo.diferencia_goles,
      promedio_favor: equipo.partidos_jugados > 0 ? (equipo.goles_favor / equipo.partidos_jugados).toFixed(2) : 0,
      promedio_contra: equipo.partidos_jugados > 0 ? (equipo.goles_contra / equipo.partidos_jugados).toFixed(2) : 0
    },
    racha: racha,
    ultimos_partidos: ultimosPartidos,
    mejores_goleadores: equipo.jugadores
      .sort((a, b) => b.goles_totales - a.goles_totales)
      .slice(0, 5)
  };

  res.json({
    success: true,
    data: rendimiento
  });
});

/**
 * @route   GET /api/v1/estadisticas/comparacion
 * @desc    Comparar estadísticas entre dos equipos
 * @access  Public
 */
const compararEquipos = asyncHandler(async (req, res) => {
  const { equipo1, equipo2 } = req.query;

  if (!equipo1 || !equipo2) {
    throw new AppError('Se requieren los IDs de ambos equipos', 400);
  }

  const [equipoA, equipoB] = await Promise.all([
    Equipo.findByPk(equipo1),
    Equipo.findByPk(equipo2)
  ]);

  if (!equipoA || !equipoB) {
    throw new AppError('Uno o ambos equipos no encontrados', 404);
  }

  // Enfrentamientos directos
  const enfrentamientos = await Partido.findAll({
    where: {
      [Op.or]: [
        {
          equipo_local_id: equipo1,
          equipo_visitante_id: equipo2
        },
        {
          equipo_local_id: equipo2,
          equipo_visitante_id: equipo1
        }
      ],
      estado: 'finalizado'
    },
    order: [['fecha', 'DESC']]
  });

  // Calcular resultados de enfrentamientos
  let victoriasEquipo1 = 0;
  let victoriasEquipo2 = 0;
  let empates = 0;

  enfrentamientos.forEach(p => {
    const equipo1EsLocal = p.equipo_local_id === parseInt(equipo1);
    const golesEquipo1 = equipo1EsLocal ? p.goles_local : p.goles_visitante;
    const golesEquipo2 = equipo1EsLocal ? p.goles_visitante : p.goles_local;

    if (golesEquipo1 > golesEquipo2) victoriasEquipo1++;
    else if (golesEquipo2 > golesEquipo1) victoriasEquipo2++;
    else empates++;
  });

  const comparacion = {
    equipo_1: {
      id: equipoA.id,
      nombre: equipoA.nombre,
      puntos: equipoA.puntos,
      partidos_jugados: equipoA.partidos_jugados,
      goles_favor: equipoA.goles_favor,
      goles_contra: equipoA.goles_contra,
      diferencia_goles: equipoA.diferencia_goles
    },
    equipo_2: {
      id: equipoB.id,
      nombre: equipoB.nombre,
      puntos: equipoB.puntos,
      partidos_jugados: equipoB.partidos_jugados,
      goles_favor: equipoB.goles_favor,
      goles_contra: equipoB.goles_contra,
      diferencia_goles: equipoB.diferencia_goles
    },
    enfrentamientos_directos: {
      total: enfrentamientos.length,
      victorias_equipo_1: victoriasEquipo1,
      victorias_equipo_2: victoriasEquipo2,
      empates: empates,
      historial: enfrentamientos
    }
  };

  res.json({
    success: true,
    data: comparacion
  });
});

module.exports = {
  obtenerGoleadores,
  obtenerEstadisticasTarjetas,
  obtenerEstadisticasGenerales,
  obtenerRendimientoEquipo,
  compararEquipos
};
