/**
 * ============================================
 * RUTAS: Sanciones
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarSanciones,
  obtenerSancion,
  crearSancion,
  actualizarSancion,
  eliminarSancion,
  levantarSancion
} = require('../controllers/sancionesController');

// Rutas públicas
router.get('/', tokenOpcional, listarSanciones);
router.get('/:id', tokenOpcional, obtenerSancion);

// Rutas protegidas
router.post('/', verificarToken, verificarRol('admin', 'vocalia'), crearSancion);
router.put('/:id', verificarToken, verificarRol('admin', 'vocalia'), actualizarSancion);
router.post('/:id/levantar', verificarToken, verificarRol('admin', 'vocalia'), levantarSancion);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarSancion);

module.exports = router;
