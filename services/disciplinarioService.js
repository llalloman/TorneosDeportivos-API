/**
 * ============================================
 * SERVICIO: Sistema Disciplinario Automático
 * ============================================
 * 
 * Maneja la lógica de acumulación de tarjetas,
 * generación automática de sanciones y multas
 */

const { Jugador, Tarjeta, Sancion, Multa, Torneo, Partido } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Procesar tarjetas y generar sanciones automáticamente
 */
const procesarTarjeta = async (tarjeta) => {
  try {
    const jugador = await Jugador.findByPk(tarjeta.jugador_id, {
      include: ['equipo']
    });

    const partido = await Partido.findByPk(tarjeta.partido_id, {
      include: ['torneo']
    });

    if (!jugador || !partido) {
      throw new Error('Jugador o partido no encontrado');
    }

    // CASO 1: Tarjeta Roja Directa
    if (tarjeta.tipo === 'roja' && !tarjeta.doble_amarilla) {
      await generarSancionTarjetaRoja(jugador, tarjeta, partido);
      await generarMultaTarjetaRoja(jugador, tarjeta, partido);
    }

    // CASO 2: Doble Amarilla (Roja indirecta)
    if (tarjeta.tipo === 'roja' && tarjeta.doble_amarilla) {
      await generarSancionDobleAmarilla(jugador, tarjeta, partido);
    }

    // CASO 3: Tarjeta Amarilla - Verificar acumulación
    if (tarjeta.tipo === 'amarilla') {
      await verificarAcumulacionAmarillas(jugador, partido.torneo_id);
    }

    // Actualizar estadísticas del jugador
    await actualizarEstadisticasJugador(jugador.id);

    // Marcar tarjeta como procesada
    tarjeta.procesada = true;
    await tarjeta.save();

    logger.info(`Tarjeta procesada: ${tarjeta.tipo} para jugador ${jugador.getNombreCompleto()}`);

    return true;
  } catch (error) {
    logger.error('Error al procesar tarjeta:', error);
    throw error;
  }
};

/**
 * Generar sanción por tarjeta roja directa
 */
const generarSancionTarjetaRoja = async (jugador, tarjeta, partido) => {
  // Según la gravedad, puede ser 1-3 partidos
  const partidosSancion = determinarPartidosSancionRoja(tarjeta.motivo);

  const sancion = await Sancion.create({
    jugador_id: jugador.id,
    tipo: 'tarjeta_roja',
    detalle: `Tarjeta roja directa en partido vs. ${partido.equipoLocal?.nombre || 'equipo'}`,
    partidos_sancion: partidosSancion,
    partidos_cumplidos: 0,
    estado: 'activa',
    fecha_inicio: new Date(),
    partido_origen_id: partido.id,
    tarjeta_origen_id: tarjeta.id,
    observaciones: tarjeta.motivo
  });

  // Bloquear jugador
  jugador.sancionado = true;
  jugador.estado = 'sancionado';
  jugador.partidos_sancion_restantes = partidosSancion;
  await jugador.save();

  logger.info(`Sanción creada: ${partidosSancion} partidos para ${jugador.getNombreCompleto()}`);

  return sancion;
};

/**
 * Generar multa por tarjeta roja
 */
const generarMultaTarjetaRoja = async (jugador, tarjeta, partido) => {
  const montoMulta = parseFloat(process.env.MULTA_TARJETA_ROJA) || 500;
  const diasPago = parseInt(process.env.DIAS_PAGO_MULTA) || 15;

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + diasPago);

  const multa = await Multa.create({
    jugador_id: jugador.id,
    partido_id: partido.id,
    tipo: 'tarjeta_roja',
    descripcion: `Multa por tarjeta roja en partido`,
    monto: montoMulta,
    moneda: 'MXN',
    estado_pago: 'pendiente',
    fecha_limite_pago: fechaLimite,
    observaciones: `Tarjeta roja en minuto ${tarjeta.minuto}`
  });

  // Marcar que tiene multas pendientes
  jugador.multas_pendientes = true;
  await jugador.save();

  logger.info(`Multa generada: $${montoMulta} para ${jugador.getNombreCompleto()}`);

  return multa;
};

/**
 * Generar sanción por doble amarilla
 */
const generarSancionDobleAmarilla = async (jugador, tarjeta, partido) => {
  const sancion = await Sancion.create({
    jugador_id: jugador.id,
    tipo: 'tarjeta_roja',
    detalle: 'Expulsión por doble amonestación',
    partidos_sancion: 1,
    partidos_cumplidos: 0,
    estado: 'activa',
    fecha_inicio: new Date(),
    partido_origen_id: partido.id,
    tarjeta_origen_id: tarjeta.id
  });

  jugador.sancionado = true;
  jugador.estado = 'sancionado';
  jugador.partidos_sancion_restantes = 1;
  await jugador.save();

  return sancion;
};

/**
 * Verificar acumulación de tarjetas amarillas
 */
const verificarAcumulacionAmarillas = async (jugador, torneoId) => {
  // Contar tarjetas amarillas del jugador en el torneo actual
  const totalAmarillas = await Tarjeta.count({
    where: {
      jugador_id: jugador.id,
      tipo: 'amarilla'
    },
    include: [{
      model: Partido,
      as: 'partido',
      where: { torneo_id: torneoId },
      attributes: []
    }]
  });

  logger.info(`Jugador ${jugador.getNombreCompleto()} tiene ${totalAmarillas} amarillas`);

  // REGLA 1: 3 tarjetas amarillas = 1 partido de suspensión
  if (totalAmarillas === 3) {
    const sancionExiste = await Sancion.findOne({
      where: {
        jugador_id: jugador.id,
        tipo: 'acumulacion_3_amarillas',
        estado: 'activa'
      }
    });

    if (!sancionExiste) {
      await Sancion.create({
        jugador_id: jugador.id,
        tipo: 'acumulacion_3_amarillas',
        detalle: 'Suspensión por acumulación de 3 tarjetas amarillas',
        partidos_sancion: 1,
        partidos_cumplidos: 0,
        estado: 'activa',
        fecha_inicio: new Date()
      });

      jugador.sancionado = true;
      jugador.estado = 'sancionado';
      jugador.partidos_sancion_restantes += 1;
      await jugador.save();

      logger.info(`Sanción por 3 amarillas para ${jugador.getNombreCompleto()}`);
    }
  }

  // REGLA 2: 5 tarjetas amarillas = 2 partidos + multa
  if (totalAmarillas === 5) {
    const sancionExiste = await Sancion.findOne({
      where: {
        jugador_id: jugador.id,
        tipo: 'acumulacion_5_amarillas',
        estado: 'activa'
      }
    });

    if (!sancionExiste) {
      await Sancion.create({
        jugador_id: jugador.id,
        tipo: 'acumulacion_5_amarillas',
        detalle: 'Suspensión por acumulación de 5 tarjetas amarillas',
        partidos_sancion: 2,
        partidos_cumplidos: 0,
        estado: 'activa',
        fecha_inicio: new Date()
      });

      // Generar multa
      const montoMulta = parseFloat(process.env.MULTA_5_AMARILLAS) || 300;
      const diasPago = parseInt(process.env.DIAS_PAGO_MULTA) || 15;
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() + diasPago);

      await Multa.create({
        jugador_id: jugador.id,
        tipo: 'acumulacion_amarillas',
        descripcion: 'Multa por acumulación de 5 tarjetas amarillas',
        monto: montoMulta,
        moneda: 'MXN',
        estado_pago: 'pendiente',
        fecha_limite_pago: fechaLimite
      });

      jugador.sancionado = true;
      jugador.estado = 'sancionado';
      jugador.partidos_sancion_restantes += 2;
      jugador.multas_pendientes = true;
      await jugador.save();

      logger.info(`Sanción por 5 amarillas + multa para ${jugador.getNombreCompleto()}`);
    }
  }
};

/**
 * Determinar partidos de sanción por tarjeta roja según gravedad
 */
const determinarPartidosSancionRoja = (motivo) => {
  if (!motivo) return 1;

  const motivoLower = motivo.toLowerCase();

  // Agresión física = 3 partidos
  if (motivoLower.includes('agresión') || motivoLower.includes('agresi') || 
      motivoLower.includes('golpe') || motivoLower.includes('violencia')) {
    return 3;
  }

  // Conducta grave = 2 partidos
  if (motivoLower.includes('insulto') || motivoLower.includes('escupir') || 
      motivoLower.includes('provocación')) {
    return 2;
  }

  // Falta profesional = 1 partido
  return 1;
};

/**
 * Actualizar estadísticas del jugador
 */
const actualizarEstadisticasJugador = async (jugadorId) => {
  const jugador = await Jugador.findByPk(jugadorId);

  // Contar tarjetas amarillas totales
  const amarillas = await Tarjeta.count({
    where: { jugador_id: jugadorId, tipo: 'amarilla' }
  });

  // Contar tarjetas rojas totales
  const rojas = await Tarjeta.count({
    where: { jugador_id: jugadorId, tipo: 'roja' }
  });

  // Actualizar
  jugador.tarjetas_amarillas = amarillas;
  jugador.tarjetas_rojas = rojas;
  await jugador.save();
};

/**
 * Verificar y actualizar estado de sanciones después de un partido
 */
const actualizarSancionesDespuesDePartido = async (partidoId) => {
  const partido = await Partido.findByPk(partidoId, {
    include: ['equipoLocal', 'equipoVisitante']
  });

  // Obtener jugadores de ambos equipos con sanciones activas
  const jugadoresSancionados = await Jugador.findAll({
    where: {
      sancionado: true,
      equipo_id: {
        [Op.in]: [partido.equipo_local_id, partido.equipo_visitante_id]
      }
    },
    include: [{
      model: Sancion,
      as: 'sanciones',
      where: { estado: 'activa' }
    }]
  });

  for (const jugador of jugadoresSancionados) {
    for (const sancion of jugador.sanciones) {
      // Incrementar partidos cumplidos
      await sancion.cumplirPartido();
      
      // Si completó la sanción
      if (sancion.estado === 'cumplida') {
        jugador.partidos_sancion_restantes = Math.max(0, jugador.partidos_sancion_restantes - 1);
        
        // Si no tiene más sanciones activas, desbloquear
        const sancionesActivas = await Sancion.count({
          where: {
            jugador_id: jugador.id,
            estado: 'activa'
          }
        });

        if (sancionesActivas === 0) {
          jugador.sancionado = false;
          jugador.estado = 'activo';
          jugador.partidos_sancion_restantes = 0;
        }

        await jugador.save();
        logger.info(`Jugador ${jugador.getNombreCompleto()} completó sanción`);
      }
    }
  }
};

module.exports = {
  procesarTarjeta,
  actualizarSancionesDespuesDePartido,
  verificarAcumulacionAmarillas,
  actualizarEstadisticasJugador
};
