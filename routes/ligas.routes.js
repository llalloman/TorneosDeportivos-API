/**
 * ============================================
 * RUTAS: Ligas
 * ============================================
 */

const express = require('express');
const router = express.Router();
const ligasController = require('../controllers/ligasController');
const { verificarToken } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// CRUD Ligas
router.get('/', ligasController.getLigas);
router.get('/:id', ligasController.getLigaById);
router.post('/', ligasController.createLiga); // Solo super_admin
router.put('/:id', ligasController.updateLiga); // super_admin o admin_liga
router.delete('/:id', ligasController.deleteLiga); // Solo super_admin

// Gestión de usuarios en liga
router.post('/:id/usuarios', ligasController.addUsuarioToLiga);
router.get('/:id/usuarios', ligasController.getUsuariosLiga);
router.delete('/:id/usuarios/:usuario_id', ligasController.removeUsuarioFromLiga);

module.exports = router;
