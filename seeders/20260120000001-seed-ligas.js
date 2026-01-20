'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();

    // 1. Crear un super_admin
    const superAdminId = uuidv4();
    await queryInterface.bulkInsert('usuarios', [{
      id: superAdminId,
      nombre: 'Super Admin',
      email: 'superadmin@torneos.com',
      password: await bcrypt.hash('admin123', 10),
      rol: 'super_admin',
      activo: true,
      created_at: now,
      updated_at: now
    }]);

    // 2. Crear usuarios para las ligas
    const adminLiga1Id = uuidv4();
    const adminLiga2Id = uuidv4();
    const delegado1Id = uuidv4();
    const arbitro1Id = uuidv4();
    const visualizador1Id = uuidv4();

    await queryInterface.bulkInsert('usuarios', [
      {
        id: adminLiga1Id,
        nombre: 'Admin Liga Norte',
        email: 'admin.norte@torneos.com',
        password: await bcrypt.hash('admin123', 10),
        rol: 'admin',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: adminLiga2Id,
        nombre: 'Admin Liga Sur',
        email: 'admin.sur@torneos.com',
        password: await bcrypt.hash('admin123', 10),
        rol: 'admin',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: delegado1Id,
        nombre: 'Juan Delegado',
        email: 'delegado@torneos.com',
        password: await bcrypt.hash('delegado123', 10),
        rol: 'delegado',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: arbitro1Id,
        nombre: 'Carlos Árbitro',
        email: 'arbitro@torneos.com',
        password: await bcrypt.hash('arbitro123', 10),
        rol: 'arbitro',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: visualizador1Id,
        nombre: 'Ana Visualizador',
        email: 'visualizador@torneos.com',
        password: await bcrypt.hash('visual123', 10),
        rol: 'jugador',
        activo: true,
        created_at: now,
        updated_at: now
      }
    ]);

    // 3. Crear ligas
    const ligaNorteId = uuidv4();
    const ligaSurId = uuidv4();
    const ligaCentroId = uuidv4();

    await queryInterface.bulkInsert('ligas', [
      {
        id: ligaNorteId,
        nombre: 'Liga Norte Regional',
        descripcion: 'Campeonato de fútbol amateur de la zona norte',
        pais: 'Argentina',
        ciudad: 'Rosario',
        activa: true,
        configuracion: JSON.stringify({
          max_equipos: 16,
          duracion_partido: 90,
          permite_arbitros_externos: true
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: ligaSurId,
        nombre: 'Liga Sur Metropolitana',
        descripcion: 'Torneo de fútbol de la zona sur metropolitana',
        pais: 'Argentina',
        ciudad: 'Buenos Aires',
        activa: true,
        configuracion: JSON.stringify({
          max_equipos: 12,
          duracion_partido: 80,
          permite_arbitros_externos: false
        }),
        created_at: now,
        updated_at: now
      },
      {
        id: ligaCentroId,
        nombre: 'Liga Centro',
        descripcion: 'Campeonato de la región central',
        pais: 'Argentina',
        ciudad: 'Córdoba',
        activa: true,
        configuracion: JSON.stringify({
          max_equipos: 14,
          duracion_partido: 90,
          permite_arbitros_externos: true
        }),
        created_at: now,
        updated_at: now
      }
    ]);

    // 4. Asignar usuarios a ligas (usuario_ligas)
    await queryInterface.bulkInsert('usuario_ligas', [
      // Admin Liga Norte
      {
        id: uuidv4(),
        usuario_id: adminLiga1Id,
        liga_id: ligaNorteId,
        rol_en_liga: 'admin_liga',
        activo: true,
        created_at: now,
        updated_at: now
      },
      // Admin Liga Sur
      {
        id: uuidv4(),
        usuario_id: adminLiga2Id,
        liga_id: ligaSurId,
        rol_en_liga: 'admin_liga',
        activo: true,
        created_at: now,
        updated_at: now
      },
      // Delegado en ambas ligas
      {
        id: uuidv4(),
        usuario_id: delegado1Id,
        liga_id: ligaNorteId,
        rol_en_liga: 'delegado',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        usuario_id: delegado1Id,
        liga_id: ligaSurId,
        rol_en_liga: 'delegado',
        activo: true,
        created_at: now,
        updated_at: now
      },
      // Árbitro en Liga Norte
      {
        id: uuidv4(),
        usuario_id: arbitro1Id,
        liga_id: ligaNorteId,
        rol_en_liga: 'arbitro',
        activo: true,
        created_at: now,
        updated_at: now
      },
      // Visualizador en todas las ligas
      {
        id: uuidv4(),
        usuario_id: visualizador1Id,
        liga_id: ligaNorteId,
        rol_en_liga: 'visualizador',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        usuario_id: visualizador1Id,
        liga_id: ligaSurId,
        rol_en_liga: 'visualizador',
        activo: true,
        created_at: now,
        updated_at: now
      },
      {
        id: uuidv4(),
        usuario_id: visualizador1Id,
        liga_id: ligaCentroId,
        rol_en_liga: 'visualizador',
        activo: true,
        created_at: now,
        updated_at: now
      }
    ]);

    console.log('Seed de ligas completado:');
    console.log('- Super Admin: superadmin@torneos.com / admin123');
    console.log('- Admin Liga Norte: admin.norte@torneos.com / admin123');
    console.log('- Admin Liga Sur: admin.sur@torneos.com / admin123');
    console.log('- Delegado (Norte y Sur): delegado@torneos.com / delegado123');
    console.log('- Árbitro (Norte): arbitro@torneos.com / arbitro123');
    console.log('- Visualizador (Todas): visualizador@torneos.com / visual123');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('usuario_ligas', null, {});
    await queryInterface.bulkDelete('ligas', null, {});
    await queryInterface.bulkDelete('usuarios', {
      email: {
        [Sequelize.Op.in]: [
          'superadmin@torneos.com',
          'admin.norte@torneos.com',
          'admin.sur@torneos.com',
          'delegado@torneos.com',
          'arbitro@torneos.com',
          'visualizador@torneos.com'
        ]
      }
    }, {});
  }
};
