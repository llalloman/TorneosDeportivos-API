/**
 * ============================================
 * RUTAS: Árbitros
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarArbitros,
  obtenerArbitro,
  crearArbitro,
  actualizarArbitro,
  eliminarArbitro,
  obtenerEstadisticas
} = require('../controllers/arbitrosController');

// Rutas públicas
router.get('/', tokenOpcional, listarArbitros);
router.get('/:id', tokenOpcional, obtenerArbitro);
router.get('/:id/estadisticas', obtenerEstadisticas);

// Rutas protegidas
router.post('/', verificarToken, verificarRol('admin'), crearArbitro);
router.put('/:id', verificarToken, verificarRol('admin'), actualizarArbitro);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarArbitro);

module.exports = router;
