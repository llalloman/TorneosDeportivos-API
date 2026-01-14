/**
 * ============================================
 * CONTROLADOR: Torneos
 * ============================================
 */

const { Torneo, Equipo, Partido } = require('../models');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');
const { Op } = require('sequelize');

/**
 * @route   GET /api/v1/torneos
 * @desc    Listar todos los torneos
 * @access  Public
 */
const listarTorneos = asyncHandler(async (req, res) => {
  const { 
    estado, 
    tipo,
    categoria,
    search,
    page = 1,
    limit = 20 
  } = req.query;

  const where = {};

  if (estado) where.estado = estado;
  if (tipo) where.tipo = tipo;
  if (categoria) where.categoria = { [Op.iLike]: `%${categoria}%` };
  if (search) {
    where[Op.or] = [
      { nombre: { [Op.iLike]: `%${search}%` } },
      { descripcion: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const offset = (page - 1) * limit;

  const { count, rows: torneos } = await Torneo.findAndCountAll({
    where,
    include: [
      {
        model: Equipo,
        as: 'equipos',
        attributes: ['id', 'nombre', 'escudo_url', 'puntos']
      }
    ],
    order: [['fecha_inicio', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      torneos,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

/**
 * @route   GET /api/v1/torneos/:id
 * @desc    Obtener torneo por ID
 * @access  Public
 */
const obtenerTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const torneo = await Torneo.findByPk(id, {
    include: [
      {
        model: Equipo,
        as: 'equipos',
        attributes: ['id', 'nombre', 'escudo_url', 'puntos', 'partidos_jugados', 'goles_favor', 'goles_contra']
      },
      {
        model: Partido,
        as: 'partidos',
        limit: 10,
        order: [['fecha', 'DESC']]
      }
    ]
  });

  if (!torneo) {
    throw new AppError('Torneo no encontrado', 404);
  }

  res.json({
    success: true,
    data: torneo
  });
});

/**
 * @route   POST /api/v1/torneos
 * @desc    Crear nuevo torneo
 * @access  Private (Admin)
 */
const crearTorneo = asyncHandler(async (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin,
    tipo,
    categoria,
    logo,
    reglamento_url,
    configuracion
  } = req.body;

  // Validaciones
  if (!nombre || !fecha_inicio) {
    throw new AppError('Nombre y fecha de inicio son requeridos', 400);
  }

  // Verificar que no exista un torneo con el mismo nombre
  const torneoExiste = await Torneo.findOne({ 
    where: { 
      nombre: { [Op.iLike]: nombre } 
    } 
  });

  if (torneoExiste) {
    throw new AppError('Ya existe un torneo con ese nombre', 409);
  }

  const torneo = await Torneo.create({
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin,
    tipo: tipo || 'liga',
    categoria,
    logo,
    reglamento_url,
    estado: 'planificacion',
    numero_equipos: 0,
    configuracion: configuracion || {
      puntos_victoria: 3,
      puntos_empate: 1,
      puntos_derrota: 0
    }
  });

  res.status(201).json({
    success: true,
    message: 'Torneo creado exitosamente',
    data: torneo
  });
});

/**
 * @route   PUT /api/v1/torneos/:id
 * @desc    Actualizar torneo
 * @access  Private (Admin)
 */
const actualizarTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado,
    tipo,
    categoria,
    logo,
    reglamento_url,
    configuracion
  } = req.body;

  const torneo = await Torneo.findByPk(id);

  if (!torneo) {
    throw new AppError('Torneo no encontrado', 404);
  }

  // Si se cambia el nombre, verificar que no exista otro con ese nombre
  if (nombre && nombre !== torneo.nombre) {
    const nombreExiste = await Torneo.findOne({
      where: {
        nombre: { [Op.iLike]: nombre },
        id: { [Op.ne]: id }
      }
    });

    if (nombreExiste) {
      throw new AppError('Ya existe otro torneo con ese nombre', 409);
    }
  }

  // Actualizar campos
  if (nombre) torneo.nombre = nombre;
  if (descripcion !== undefined) torneo.descripcion = descripcion;
  if (fecha_inicio) torneo.fecha_inicio = fecha_inicio;
  if (fecha_fin !== undefined) torneo.fecha_fin = fecha_fin;
  if (estado) torneo.estado = estado;
  if (tipo) torneo.tipo = tipo;
  if (categoria !== undefined) torneo.categoria = categoria;
  if (logo !== undefined) torneo.logo = logo;
  if (reglamento_url !== undefined) torneo.reglamento_url = reglamento_url;
  if (configuracion) torneo.configuracion = configuracion;

  await torneo.save();

  res.json({
    success: true,
    message: 'Torneo actualizado exitosamente',
    data: torneo
  });
});

/**
 * @route   DELETE /api/v1/torneos/:id
 * @desc    Eliminar torneo
 * @access  Private (Admin)
 */
const eliminarTorneo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const torneo = await Torneo.findByPk(id, {
    include: [{ model: Equipo, as: 'equipos' }]
  });

  if (!torneo) {
    throw new AppError('Torneo no encontrado', 404);
  }

  // Verificar si tiene equipos registrados
  if (torneo.equipos && torneo.equipos.length > 0) {
    throw new AppError('No se puede eliminar un torneo con equipos registrados', 400);
  }

  await torneo.destroy();

  res.json({
    success: true,
    message: 'Torneo eliminado exitosamente'
  });
});

/**
 * @route   GET /api/v1/torneos/:id/tabla
 * @desc    Obtener tabla de posiciones del torneo
 * @access  Public
 */
const obtenerTabla = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const torneo = await Torneo.findByPk(id);

  if (!torneo) {
    throw new AppError('Torneo no encontrado', 404);
  }

  const equipos = await Equipo.findAll({
    where: { torneo_id: id },
    order: [
      ['puntos', 'DESC'],
      ['diferencia_goles', 'DESC'],
      ['goles_favor', 'DESC']
    ],
    attributes: [
      'id',
      'nombre',
      'escudo_url',
      'partidos_jugados',
      'partidos_ganados',
      'partidos_empatados',
      'partidos_perdidos',
      'puntos',
      'goles_favor',
      'goles_contra',
      'diferencia_goles'
    ]
  });

  res.json({
    success: true,
    data: {
      torneo: {
        id: torneo.id,
        nombre: torneo.nombre
      },
      tabla: equipos
    }
  });
});

module.exports = {
  listarTorneos,
  obtenerTorneo,
  crearTorneo,
  actualizarTorneo,
  eliminarTorneo,
  obtenerTabla
};
