/**
 * ============================================
 * RUTAS: Multas
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { verificarToken, verificarRol } = require('../middlewares/auth');
const {
  listarMultas,
  obtenerMulta,
  crearMulta,
  actualizarMulta,
  registrarPago,
  eliminarMulta,
  obtenerResumen
} = require('../controllers/multasController');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas para admin/vocalia
router.get('/resumen', verificarRol('admin', 'vocalia'), obtenerResumen);
router.post('/', verificarRol('admin', 'vocalia'), crearMulta);
router.post('/:id/pagar', verificarRol('admin', 'vocalia'), registrarPago);
router.put('/:id', verificarRol('admin', 'vocalia'), actualizarMulta);
router.delete('/:id', verificarRol('admin'), eliminarMulta);

// Rutas accesibles por admin, vocalia y delegado
router.get('/', listarMultas);
router.get('/:id', obtenerMulta);

module.exports = router;
