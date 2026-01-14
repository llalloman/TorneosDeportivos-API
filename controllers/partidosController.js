/**
 * ============================================
 * CONTROLADOR: Partidos
 * ============================================
 */

const { Partido, Equipo, Arbitro, Tarjeta, Goleador, Jugador } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { procesarTarjeta, actualizarSancionesDespuesDePartido } = require('../services/disciplinarioService');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/partidos
 * @desc    Listar todos los partidos
 * @access  Public
 */
const listarPartidos = asyncHandler(async (req, res) => {
  const { 
    torneo, 
    equipo, 
    estado, 
    fecha_desde, 
    fecha_hasta,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};

  if (torneo) where.torneo_id = torneo;
  if (estado) where.estado = estado;
  if (equipo) {
    where[Op.or] = [
      { equipo_local_id: equipo },
      { equipo_visitante_id: equipo }
    ];
  }
  if (fecha_desde || fecha_hasta) {
    where.fecha = {};
    if (fecha_desde) where.fecha[Op.gte] = new Date(fecha_desde);
    if (fecha_hasta) where.fecha[Op.lte] = new Date(fecha_hasta);
  }

  const offset = (page - 1) * limit;

  const { count, rows: partidos } = await Partido.findAndCountAll({
    where,
    include: [
      { model: Equipo, as: 'equipoLocal', attributes: ['id', 'nombre', 'escudo_url'] },
      { model: Equipo, as: 'equipoVisitante', attributes: ['id', 'nombre', 'escudo_url'] },
      { model: Arbitro, as: 'arbitro', attributes: ['id', 'nombre', 'apellido_paterno'] }
    ],
    order: [['fecha', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      partidos,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   POST /api/v1/partidos
 * @desc    Crear nuevo partido
 * @access  Private (Admin)
 */
const crearPartido = asyncHandler(async (req, res) => {
  const {
    torneo_id,
    equipo_local_id,
    equipo_visitante_id,
    arbitro_id,
    fecha,
    jornada,
    campo
  } = req.body;

  // Validaciones
  if (!torneo_id || !equipo_local_id || !equipo_visitante_id || !fecha) {
    throw new AppError('Datos insuficientes para crear el partido', 400);
  }

  if (equipo_local_id === equipo_visitante_id) {
    throw new AppError('El equipo local y visitante no pueden ser el mismo', 400);
  }

  const partido = await Partido.create({
    torneo_id,
    equipo_local_id,
    equipo_visitante_id,
    arbitro_id,
    fecha,
    jornada,
    campo,
    estado: 'programado'
  });

  const partidoCompleto = await Partido.findByPk(partido.id, {
    include: [
      { model: Equipo, as: 'equipoLocal' },
      { model: Equipo, as: 'equipoVisitante' },
      { model: Arbitro, as: 'arbitro' }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Partido creado exitosamente',
    data: partidoCompleto
  });
});

/**
 * @route   POST /api/v1/partidos/:id/resultado
 * @desc    Registrar resultado del partido
 * @access  Private (Arbitro, Admin)
 */
const registrarResultado = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { goles_local, goles_visitante, penales_local, penales_visitante, observaciones } = req.body;

  const partido = await Partido.findByPk(id, {
    include: ['equipoLocal', 'equipoVisitante']
  });

  if (!partido) {
    throw new AppError('Partido no encontrado', 404);
  }

  // Actualizar resultado
  partido.goles_local = goles_local;
  partido.goles_visitante = goles_visitante;
  partido.penales_local = penales_local || null;
  partido.penales_visitante = penales_visitante || null;
  partido.observaciones = observaciones;
  partido.estado = 'finalizado';
  partido.fecha_fin_real = new Date();

  await partido.save();

  // Actualizar estadísticas de equipos
  await actualizarEstadisticasEquipos(partido);

  // Actualizar sanciones de jugadores
  await actualizarSancionesDespuesDePartido(id);

  res.json({
    success: true,
    message: 'Resultado registrado exitosamente',
    data: partido
  });
});

/**
 * @route   POST /api/v1/partidos/:id/tarjetas
 * @desc    Registrar tarjetas del partido
 * @access  Private (Arbitro, Admin)
 */
const registrarTarjetas = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tarjetas } = req.body; // Array de tarjetas

  if (!Array.isArray(tarjetas) || tarjetas.length === 0) {
    throw new AppError('Debe proporcionar un array de tarjetas', 400);
  }

  const partido = await Partido.findByPk(id);
  if (!partido) {
    throw new AppError('Partido no encontrado', 404);
  }

  const tarjetasCreadas = [];

  for (const tarjetaData of tarjetas) {
    const tarjeta = await Tarjeta.create({
      jugador_id: tarjetaData.jugador_id,
      partido_id: id,
      tipo: tarjetaData.tipo,
      minuto: tarjetaData.minuto,
      motivo: tarjetaData.motivo,
      doble_amarilla: tarjetaData.doble_amarilla || false
    });

    // Procesar automáticamente (acumulación, sanciones, multas)
    await procesarTarjeta(tarjeta);

    tarjetasCreadas.push(tarjeta);
  }

  res.status(201).json({
    success: true,
    message: `${tarjetasCreadas.length} tarjeta(s) registrada(s) y procesada(s) exitosamente`,
    data: tarjetasCreadas
  });
});

/**
 * @route   POST /api/v1/partidos/:id/goles
 * @desc    Registrar goles del partido
 * @access  Private (Arbitro, Admin)
 */
const registrarGoles = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { goles } = req.body; // Array de goles

  if (!Array.isArray(goles) || goles.length === 0) {
    throw new AppError('Debe proporcionar un array de goles', 400);
  }

  const partido = await Partido.findByPk(id);
  if (!partido) {
    throw new AppError('Partido no encontrado', 404);
  }

  const golesCreados = [];

  for (const golData of goles) {
    const gol = await Goleador.create({
      jugador_id: golData.jugador_id,
      partido_id: id,
      minuto: golData.minuto,
      tipo: golData.tipo || 'normal',
      es_autogol: golData.es_autogol || false,
      asistencia_jugador_id: golData.asistencia_jugador_id || null,
      observaciones: golData.observaciones
    });

    // Actualizar estadísticas del jugador
    if (!gol.es_autogol) {
      const jugador = await Jugador.findByPk(golData.jugador_id);
      jugador.goles_totales += 1;
      await jugador.save();
    }

    golesCreados.push(gol);
  }

  res.status(201).json({
    success: true,
    message: `${golesCreados.length} gol(es) registrado(s) exitosamente`,
    data: golesCreados
  });
});

/**
 * Actualizar estadísticas de los equipos
 */
const actualizarEstadisticasEquipos = async (partido) => {
  const equipoLocal = await Equipo.findByPk(partido.equipo_local_id);
  const equipoVisitante = await Equipo.findByPk(partido.equipo_visitante_id);

  // Actualizar partidos jugados
  equipoLocal.partidos_jugados += 1;
  equipoVisitante.partidos_jugados += 1;

  // Actualizar goles
  equipoLocal.goles_favor += partido.goles_local;
  equipoLocal.goles_contra += partido.goles_visitante;
  equipoVisitante.goles_favor += partido.goles_visitante;
  equipoVisitante.goles_contra += partido.goles_local;

  // Determinar ganador y actualizar estadísticas
  if (partido.goles_local > partido.goles_visitante) {
    equipoLocal.partidos_ganados += 1;
    equipoLocal.puntos += 3;
    equipoVisitante.partidos_perdidos += 1;
  } else if (partido.goles_visitante > partido.goles_local) {
    equipoVisitante.partidos_ganados += 1;
    equipoVisitante.puntos += 3;
    equipoLocal.partidos_perdidos += 1;
  } else {
    equipoLocal.partidos_empatados += 1;
    equipoLocal.puntos += 1;
    equipoVisitante.partidos_empatados += 1;
    equipoVisitante.puntos += 1;
  }

  // Diferencia de goles
  equipoLocal.diferencia_goles = equipoLocal.goles_favor - equipoLocal.goles_contra;
  equipoVisitante.diferencia_goles = equipoVisitante.goles_favor - equipoVisitante.goles_contra;

  await equipoLocal.save();
  await equipoVisitante.save();
};

module.exports = {
  listarPartidos,
  crearPartido,
  registrarResultado,
  registrarTarjetas,
  registrarGoles
};
