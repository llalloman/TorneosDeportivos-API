/**
 * ============================================
 * RUTAS: Torneos
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol, tokenOpcional } = require('../middlewares/auth');
const {
  listarTorneos,
  obtenerTorneo,
  crearTorneo,
  actualizarTorneo,
  eliminarTorneo,
  obtenerTabla
} = require('../controllers/torneosController');

// Rutas públicas
router.get('/', tokenOpcional, listarTorneos);
router.get('/:id', tokenOpcional, obtenerTorneo);
router.get('/:id/tabla', obtenerTabla);

// Rutas protegidas (Admin)
router.post('/', verificarToken, verificarRol('admin'), crearTorneo);
router.put('/:id', verificarToken, verificarRol('admin'), actualizarTorneo);
router.delete('/:id', verificarToken, verificarRol('admin'), eliminarTorneo);

module.exports = router;
