/**
 * ============================================
 * RUTAS: Estadísticas
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { tokenOpcional } = require('../middlewares/auth');
const {
  obtenerGoleadores,
  obtenerEstadisticasTarjetas,
  obtenerEstadisticasGenerales,
  obtenerRendimientoEquipo,
  compararEquipos
} = require('../controllers/estadisticasController');

// Todas las rutas son públicas
router.get('/goleadores', tokenOpcional, obtenerGoleadores);
router.get('/tarjetas', tokenOpcional, obtenerEstadisticasTarjetas);
router.get('/general', tokenOpcional, obtenerEstadisticasGenerales);
router.get('/rendimiento/:equipoId', tokenOpcional, obtenerRendimientoEquipo);
router.get('/comparacion', tokenOpcional, compararEquipos);

module.exports = router;
