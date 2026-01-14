/**
 * ============================================
 * RUTAS: Partidos
 * ============================================
 */

const express = require('express');
const router = express.Router();
const {
  listarPartidos,
  crearPartido,
  registrarResultado,
  registrarTarjetas,
  registrarGoles
} = require('../controllers/partidosController');
const { verificarToken, verificarRol } = require('../middlewares/auth');

// Rutas públicas
router.get('/', listarPartidos);

// Rutas protegidas - Admin
router.post('/', verificarToken, verificarRol('admin'), crearPartido);

// Rutas protegidas - Árbitro y Admin
router.post('/:id/resultado', verificarToken, verificarRol('arbitro', 'admin'), registrarResultado);
router.post('/:id/tarjetas', verificarToken, verificarRol('arbitro', 'admin'), registrarTarjetas);
router.post('/:id/goles', verificarToken, verificarRol('arbitro', 'admin'), registrarGoles);

module.exports = router;
