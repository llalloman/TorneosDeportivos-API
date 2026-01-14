/**
 * ============================================
 * SERVIDOR PRINCIPAL - Backend API
 * Sistema de Gestión de Torneos Deportivos
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configuraciones
const db = require('./models');
const logger = require('./utils/logger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const torneosRoutes = require('./routes/torneos.routes');
const equiposRoutes = require('./routes/equipos.routes');
const jugadoresRoutes = require('./routes/jugadores.routes');
const partidosRoutes = require('./routes/partidos.routes');
const sancionesRoutes = require('./routes/sanciones.routes');
const multasRoutes = require('./routes/multas.routes');
const arbitrosRoutes = require('./routes/arbitros.routes');
const vocaliasRoutes = require('./routes/vocalias.routes');
const estadisticasRoutes = require('./routes/estadisticas.routes');

// Importar middleware de errores
const { errorHandler } = require('./middlewares/errorHandler');

// ============================================
// INICIALIZAR APP
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Trust proxy - necesario para Render y otros proxies
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Seguridad
app.use(helmet());

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://torneos-frontend-0jsn.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS preflight para todas las rutas
app.options('*', cors());

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // En producción, cambiar a false si quieres restringir
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// RUTAS
// ============================================

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API Sistema de Gestión de Torneos Deportivos',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Rutas de la API
logger.info('Cargando rutas...');
logger.info(`authRoutes: ${typeof authRoutes}`);
logger.info(`torneosRoutes: ${typeof torneosRoutes}`);
logger.info(`equiposRoutes: ${typeof equiposRoutes}`);
logger.info(`jugadoresRoutes: ${typeof jugadoresRoutes}`);
logger.info(`partidosRoutes: ${typeof partidosRoutes}`);
logger.info(`sancionesRoutes: ${typeof sancionesRoutes}`);
logger.info(`multasRoutes: ${typeof multasRoutes}`);
logger.info(`arbitrosRoutes: ${typeof arbitrosRoutes}`);
logger.info(`vocaliasRoutes: ${typeof vocaliasRoutes}`);
logger.info(`estadisticasRoutes: ${typeof estadisticasRoutes}`);

if (authRoutes) app.use(`/api/${API_VERSION}/auth`, authRoutes);
if (torneosRoutes) app.use(`/api/${API_VERSION}/torneos`, torneosRoutes);
if (equiposRoutes) app.use(`/api/${API_VERSION}/equipos`, equiposRoutes);
if (jugadoresRoutes) app.use(`/api/${API_VERSION}/jugadores`, jugadoresRoutes);
if (partidosRoutes) app.use(`/api/${API_VERSION}/partidos`, partidosRoutes);
if (sancionesRoutes) app.use(`/api/${API_VERSION}/sanciones`, sancionesRoutes);
if (multasRoutes) app.use(`/api/${API_VERSION}/multas`, multasRoutes);
if (arbitrosRoutes) app.use(`/api/${API_VERSION}/arbitros`, arbitrosRoutes);
if (vocaliasRoutes) app.use(`/api/${API_VERSION}/vocalias`, vocaliasRoutes);
if (estadisticasRoutes) app.use(`/api/${API_VERSION}/estadisticas`, estadisticasRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================

// Sincronizar base de datos y arrancar servidor
const startServer = async () => {
  try {
    // Testear conexión a la base de datos
    await db.sequelize.authenticate();
    logger.info('✅ Conexión a la base de datos establecida correctamente');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
      logger.info(`📡 Entorno: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`💚 Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    console.error('Error completo:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  logger.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM recibido, cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT recibido, cerrando servidor gracefully...');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;
