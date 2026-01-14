/**
 * ============================================
 * CONTROLADOR: Multas
 * ============================================
 */

const { Multa, Jugador, Equipo, Partido } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/multas
 * @desc    Listar todas las multas
 * @access  Private (Admin, Vocalia, Delegado)
 */
const listarMultas = asyncHandler(async (req, res) => {
  const { 
    jugador,
    equipo,
    pagada,
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
  if (pagada !== undefined) where.pagada = pagada === 'true';

  // Filtro por equipo
  if (equipo) {
    includeJugador.where = { equipo_id: equipo };
    includeJugador.required = true;
  }

  // Si es delegado, solo puede ver multas de su equipo
  if (req.usuario.rol === 'delegado') {
    const equipos = await Equipo.findAll({
      where: { delegado_usuario_id: req.usuario.id },
      attributes: ['id']
    });
    const equipoIds = equipos.map(e => e.id);
    
    if (equipoIds.length > 0) {
      includeJugador.where = { 
        ...includeJugador.where,
        equipo_id: { [Op.in]: equipoIds }
      };
      includeJugador.required = true;
    } else {
      // Delegado sin equipos, no puede ver ninguna multa
      return res.json({
        success: true,
        data: {
          multas: [],
          pagination: { total: 0, page: 1, pages: 0 }
        }
      });
    }
  }

  const offset = (page - 1) * limit;

  const { count, rows: multas } = await Multa.findAndCountAll({
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
    order: [['fecha_emision', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      multas,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/multas/:id
 * @desc    Obtener multa por ID
 * @access  Private (Admin, Vocalia, Delegado del equipo)
 */
const obtenerMulta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const multa = await Multa.findByPk(id, {
    include: [
      {
        model: Jugador,
        as: 'jugador',
        attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'numero_camiseta', 'equipo_id'],
        include: [
          {
            model: Equipo,
            as: 'equipo',
            attributes: ['id', 'nombre', 'delegado_usuario_id']
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

  if (!multa) {
    throw new AppError('Multa no encontrada', 404);
  }

  // Verificar permisos si es delegado
  if (req.usuario.rol === 'delegado') {
    if (!multa.jugador?.equipo || multa.jugador.equipo.delegado_usuario_id !== req.usuario.id) {
      throw new AppError('No tiene permisos para ver esta multa', 403);
    }
  }

  res.json({
    success: true,
    data: multa
  });
});

/**
 * @route   POST /api/v1/multas
 * @desc    Crear nueva multa
 * @access  Private (Admin o Vocalia)
 */
const crearMulta = asyncHandler(async (req, res) => {
  const {
    jugador_id,
    partido_id,
    motivo,
    monto,
    fecha_limite_pago
  } = req.body;

  // Validaciones
  if (!jugador_id || !motivo || !monto) {
    throw new AppError('jugador_id, motivo y monto son requeridos', 400);
  }

  if (monto <= 0) {
    throw new AppError('El monto debe ser mayor a 0', 400);
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

  const multa = await Multa.create({
    jugador_id,
    partido_id,
    motivo,
    monto,
    fecha_emision: new Date(),
    fecha_limite_pago,
    pagada: false
  });

  res.status(201).json({
    success: true,
    message: 'Multa creada exitosamente',
    data: multa
  });
});

/**
 * @route   PUT /api/v1/multas/:id
 * @desc    Actualizar multa
 * @access  Private (Admin o Vocalia)
 */
const actualizarMulta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    motivo,
    monto,
    fecha_limite_pago
  } = req.body;

  const multa = await Multa.findByPk(id);

  if (!multa) {
    throw new AppError('Multa no encontrada', 404);
  }

  if (multa.pagada) {
    throw new AppError('No se puede modificar una multa que ya ha sido pagada', 400);
  }

  // Actualizar campos
  if (motivo) multa.motivo = motivo;
  if (monto !== undefined) {
    if (monto <= 0) {
      throw new AppError('El monto debe ser mayor a 0', 400);
    }
    multa.monto = monto;
  }
  if (fecha_limite_pago !== undefined) multa.fecha_limite_pago = fecha_limite_pago;

  await multa.save();

  res.json({
    success: true,
    message: 'Multa actualizada exitosamente',
    data: multa
  });
});

/**
 * @route   POST /api/v1/multas/:id/pagar
 * @desc    Registrar pago de multa
 * @access  Private (Admin, Vocalia)
 */
const registrarPago = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fecha_pago, metodo_pago, referencia_pago } = req.body;

  const multa = await Multa.findByPk(id);

  if (!multa) {
    throw new AppError('Multa no encontrada', 404);
  }

  if (multa.pagada) {
    throw new AppError('Esta multa ya ha sido pagada', 400);
  }

  multa.pagada = true;
  multa.fecha_pago = fecha_pago || new Date();
  if (metodo_pago) multa.metodo_pago = metodo_pago;
  if (referencia_pago) multa.referencia_pago = referencia_pago;

  await multa.save();

  res.json({
    success: true,
    message: 'Pago registrado exitosamente',
    data: multa
  });
});

/**
 * @route   DELETE /api/v1/multas/:id
 * @desc    Eliminar multa
 * @access  Private (Admin)
 */
const eliminarMulta = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const multa = await Multa.findByPk(id);

  if (!multa) {
    throw new AppError('Multa no encontrada', 404);
  }

  if (multa.pagada) {
    throw new AppError('No se puede eliminar una multa que ya ha sido pagada', 400);
  }

  await multa.destroy();

  res.json({
    success: true,
    message: 'Multa eliminada exitosamente'
  });
});

/**
 * @route   GET /api/v1/multas/resumen
 * @desc    Obtener resumen de multas
 * @access  Private (Admin, Vocalia)
 */
const obtenerResumen = asyncHandler(async (req, res) => {
  const { equipo } = req.query;

  const where = {};
  const includeJugador = {
    model: Jugador,
    as: 'jugador',
    attributes: ['id', 'equipo_id']
  };

  if (equipo) {
    includeJugador.where = { equipo_id: equipo };
    includeJugador.required = true;
  }

  const [totalMultas, multasPendientes, multasPagadas] = await Promise.all([
    Multa.count({ where, include: equipo ? [includeJugador] : [] }),
    Multa.count({ 
      where: { ...where, pagada: false },
      include: equipo ? [includeJugador] : []
    }),
    Multa.count({ 
      where: { ...where, pagada: true },
      include: equipo ? [includeJugador] : []
    })
  ]);

  const multasData = await Multa.findAll({
    where,
    attributes: ['monto', 'pagada'],
    include: equipo ? [includeJugador] : []
  });

  const montoPendiente = multasData
    .filter(m => !m.pagada)
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  const montoRecaudado = multasData
    .filter(m => m.pagada)
    .reduce((sum, m) => sum + parseFloat(m.monto), 0);

  const resumen = {
    total_multas: totalMultas,
    multas_pendientes: multasPendientes,
    multas_pagadas: multasPagadas,
    monto_pendiente: montoPendiente,
    monto_recaudado: montoRecaudado,
    monto_total: montoPendiente + montoRecaudado
  };

  res.json({
    success: true,
    data: resumen
  });
});

module.exports = {
  listarMultas,
  obtenerMulta,
  crearMulta,
  actualizarMulta,
  registrarPago,
  eliminarMulta,
  obtenerResumen
};
