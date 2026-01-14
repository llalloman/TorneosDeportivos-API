/**
 * ============================================
 * RUTAS: Equipos
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarEquipos,
  obtenerEquipo,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
  obtenerEstadisticas
} = require('../controllers/equiposController');

// Rutas públicas
router.get('/', tokenOpcional, listarEquipos);
router.get('/:id', tokenOpcional, obtenerEquipo);
router.get('/:id/estadisticas', obtenerEstadisticas);

// Rutas protegidas
router.post('/', verificarToken, verificarRol('admin'), crearEquipo);
router.put('/:id', verificarToken, actualizarEquipo); // Admin o Delegado del equipo
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarEquipo);

module.exports = router;
