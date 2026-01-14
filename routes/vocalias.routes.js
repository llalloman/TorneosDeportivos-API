/**
 * ============================================
 * RUTAS: Vocalías
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarVocalias,
  obtenerVocalia,
  crearVocalia,
  actualizarVocalia,
  eliminarVocalia
} = require('../controllers/vocaliasController');

// Rutas públicas
router.get('/', tokenOpcional, listarVocalias);
router.get('/:id', tokenOpcional, obtenerVocalia);

// Rutas protegidas
router.post('/', verificarToken, verificarRol('admin'), crearVocalia);
router.put('/:id', verificarToken, verificarRol('admin'), actualizarVocalia);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarVocalia);

module.exports = router;
