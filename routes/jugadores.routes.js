/**
 * ============================================
 * RUTAS: Jugadores
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarJugadores,
  obtenerJugador,
  crearJugador,
  actualizarJugador,
  eliminarJugador,
  verificarEstado,
  obtenerEstadisticas
} = require('../controllers/jugadoresController');

// Rutas públicas
router.get('/', tokenOpcional, listarJugadores);
router.get('/:id', tokenOpcional, obtenerJugador);
router.get('/:id/estado', verificarEstado);
router.get('/:id/estadisticas', obtenerEstadisticas);

// Rutas protegidas
router.post('/', verificarToken, verificarRol('admin', 'delegado'), crearJugador);
router.put('/:id', verificarToken, actualizarJugador);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarJugador);

module.exports = router;
