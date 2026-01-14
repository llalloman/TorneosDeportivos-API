# 🚀 GUÍA DE CONFIGURACIÓN Y EJECUCIÓN - Base de Datos Neon

## 📋 Pre-requisitos

- Node.js v18 o superior
- npm o yarn instalado
- Cuenta en Neon (PostgreSQL serverless)

## 🔧 Configuración Inicial

### 1. Variables de Entorno

El archivo `.env` ya está configurado con las credenciales de Neon:

```env
DB_HOST=ep-hidden-morning-a8dh4odx-pooler.eastus2.azure.neon.tech
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_ZuT2PWCzivy7
DB_SSL=true
```

### 2. Instalar Dependencias

```bash
cd backend
npm install
```

## 🗄️ Ejecutar Migraciones

### Crear todas las tablas en Neon:

```bash
# Ejecutar todas las migraciones
npm run migrate

# O usando sequelize-cli directamente
npx sequelize-cli db:migrate
```

Esto creará las siguientes tablas:
- ✅ usuarios
- ✅ torneos
- ✅ arbitros
- ✅ equipos
- ✅ jugadores
- ✅ partidos
- ✅ tarjetas
- ✅ sanciones
- ✅ multas
- ✅ goleadores
- ✅ vocalias

### Verificar estado de migraciones:

```bash
npx sequelize-cli db:migrate:status
```

### Rollback (deshacer última migración):

```bash
npm run migrate:undo
```

## 🌱 Cargar Datos Iniciales (Seeders)

```bash
# Ejecutar todos los seeders
npm run seed

# O usando sequelize-cli
npx sequelize-cli db:seed:all
```

Esto insertará datos de prueba:
- 4 usuarios (admin, árbitro, delegado, jugador)
- 1 torneo activo
- 1 árbitro
- 2 equipos
- 2 jugadores

**Credenciales de prueba:**
- **Admin:** admin@torneosdeportivos.com / password123
- **Árbitro:** arbitro1@torneosdeportivos.com / password123
- **Delegado:** delegado1@torneosdeportivos.com / password123
- **Jugador:** jugador1@torneosdeportivos.com / password123

### Limpiar datos de seeders:

```bash
npm run seed:undo
```

## 🚀 Iniciar el Servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## 🔍 Endpoints de Prueba

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@torneosdeportivos.com","password":"password123"}'
```

## 📊 Verificar Base de Datos

Puedes conectarte directamente a Neon usando:

```bash
psql 'postgresql://neondb_owner:npg_ZuT2PWCzivy7@ep-hidden-morning-a8dh4odx-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
```

Comandos útiles en psql:
```sql
-- Ver todas las tablas
\dt

-- Contar usuarios
SELECT COUNT(*) FROM usuarios;

-- Ver torneos
SELECT * FROM torneos;

-- Ver migraciones ejecutadas
SELECT * FROM "SequelizeMeta";
```

## 🛠️ Comandos Útiles

```bash
# Ver todas las migraciones disponibles
npx sequelize-cli db:migrate:status

# Crear nueva migración
npx sequelize-cli migration:generate --name nombre-de-la-migracion

# Crear nuevo seeder
npx sequelize-cli seed:generate --name nombre-del-seeder

# Rollback todas las migraciones (¡CUIDADO!)
npx sequelize-cli db:migrate:undo:all

# Rehacer migraciones (drop y recrear)
npm run migrate:undo && npm run migrate
```

## ⚠️ Notas Importantes

1. **SSL Requerido:** Neon requiere SSL, ya está configurado en `.env`
2. **Pool de Conexiones:** Neon usa connection pooling en el puerto 5432
3. **Backup:** Neon hace backups automáticos, pero considera exportar datos importantes
4. **Límites:** Verifica los límites de tu plan en Neon (conexiones, storage, etc.)

## 🐛 Solución de Problemas

### Error de conexión SSL:
```bash
# Verificar que DB_SSL=true en .env
# Verificar que DB_SSL_REJECT_UNAUTHORIZED=false
```

### Error "relation does not exist":
```bash
# Ejecutar migraciones
npm run migrate
```

### Error de autenticación:
```bash
# Verificar credenciales en .env
# Verificar que la password no tenga caracteres especiales sin escapar
```

## 📚 Próximos Pasos

1. ✅ Ejecutar migraciones: `npm run migrate`
2. ✅ Cargar datos de prueba: `npm run seed`
3. ✅ Iniciar servidor: `npm run dev`
4. 🔄 Probar endpoints con Postman o curl
5. 🚀 Desarrollar los controladores faltantes

---

**¡Listo!** Tu base de datos en Neon está configurada y lista para usar. 🎉
