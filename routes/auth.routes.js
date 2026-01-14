/**
 * ============================================
 * RUTAS: Autenticación
 * ============================================
 */

const express = require('express');
const router = express.Router();
const {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  listarUsuarios
} = require('../controllers/authController');
const { verificarToken } = require('../middlewares/auth');

// Rutas públicas
router.post('/register', registrar);
router.post('/login', login);

// Rutas protegidas
router.get('/profile', verificarToken, obtenerPerfil);
router.put('/profile', verificarToken, actualizarPerfil);
router.put('/change-password', verificarToken, cambiarPassword);
router.get('/usuarios', verificarToken, listarUsuarios);

module.exports = router;
