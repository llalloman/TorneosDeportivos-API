'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash de password para usuarios de prueba
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Insertar usuarios
    await queryInterface.bulkInsert('usuarios', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        nombre: 'Administrador Sistema',
        email: 'admin@torneosdeportivos.com',
        password: hashedPassword,
        rol: 'admin',
        telefono: '555-1001',
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        nombre: 'Juan Pérez Árbitro',
        email: 'arbitro1@torneosdeportivos.com',
        password: hashedPassword,
        rol: 'arbitro',
        telefono: '555-2001',
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        nombre: 'Carlos Delegado García',
        email: 'delegado1@torneosdeportivos.com',
        password: hashedPassword,
        rol: 'delegado',
        telefono: '555-3001',
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        nombre: 'Miguel Jugador López',
        email: 'jugador1@torneosdeportivos.com',
        password: hashedPassword,
        rol: 'jugador',
        telefono: '555-4001',
        activo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insertar torneo de ejemplo
    await queryInterface.bulkInsert('torneos', [
      {
        id: '660e8400-e29b-41d4-a716-446655440001',
        nombre: 'Torneo Apertura 2026',
        descripcion: 'Torneo de fútbol amateur - Temporada Apertura 2026',
        fecha_inicio: new Date('2026-02-01'),
        fecha_fin: new Date('2026-06-30'),
        estado: 'en_curso',
        tipo: 'liga',
        categoria: 'Libre',
        numero_equipos: 0,
        configuracion: JSON.stringify({
          puntos_victoria: 3,
          puntos_empate: 1,
          puntos_derrota: 0
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insertar árbitro
    await queryInterface.bulkInsert('arbitros', [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        nombre: 'Juan',
        apellido_paterno: 'Pérez',
        apellido_materno: 'Gómez',
        usuario_id: '550e8400-e29b-41d4-a716-446655440002',
        activo: true,
        partidos_dirigidos: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insertar equipos de ejemplo
    await queryInterface.bulkInsert('equipos', [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        nombre: 'Águilas FC',
        torneo_id: '660e8400-e29b-41d4-a716-446655440001',
        delegado_nombre: 'Carlos García',
        delegado_telefono: '555-3001',
        delegado_email: 'delegado1@torneosdeportivos.com',
        delegado_usuario_id: '550e8400-e29b-41d4-a716-446655440003',
        estado: 'activo',
        partidos_jugados: 0,
        puntos: 0,
        goles_favor: 0,
        goles_contra: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        nombre: 'Leones United',
        torneo_id: '660e8400-e29b-41d4-a716-446655440001',
        delegado_nombre: 'Pedro Martínez',
        delegado_telefono: '555-3002',
        delegado_email: 'pedro.martinez@email.com',
        estado: 'activo',
        partidos_jugados: 0,
        puntos: 0,
        goles_favor: 0,
        goles_contra: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insertar jugadores de ejemplo
    await queryInterface.bulkInsert('jugadores', [
      {
        id: '990e8400-e29b-41d4-a716-446655440001',
        nombre: 'Miguel',
        apellido_paterno: 'López',
        apellido_materno: 'Ramírez',
        equipo_id: '880e8400-e29b-41d4-a716-446655440001',
        usuario_id: '550e8400-e29b-41d4-a716-446655440004',
        fecha_nacimiento: new Date('1995-05-15'),
        numero_camiseta: 10,
        posicion: 'delantero',
        sancionado: false,
        partidos_sancion_restantes: 0,
        multas_pendientes: false,
        goles_totales: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        partidos_jugados: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440002',
        nombre: 'Roberto',
        apellido_paterno: 'Sánchez',
        apellido_materno: 'Torres',
        equipo_id: '880e8400-e29b-41d4-a716-446655440001',
        fecha_nacimiento: new Date('1998-08-20'),
        numero_camiseta: 9,
        posicion: 'delantero',
        sancionado: false,
        partidos_sancion_restantes: 0,
        multas_pendientes: false,
        goles_totales: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        partidos_jugados: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440003',
        nombre: 'Carlos',
        apellido_paterno: 'Fernández',
        apellido_materno: 'Ruiz',
        equipo_id: '880e8400-e29b-41d4-a716-446655440002',
        fecha_nacimiento: new Date('1996-03-10'),
        numero_camiseta: 11,
        posicion: 'medio',
        sancionado: false,
        partidos_sancion_restantes: 0,
        multas_pendientes: false,
        goles_totales: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        partidos_jugados: 0,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440004',
        nombre: 'Luis',
        apellido_paterno: 'Rodríguez',
        apellido_materno: 'Díaz',
        equipo_id: '880e8400-e29b-41d4-a716-446655440002',
        fecha_nacimiento: new Date('1997-07-25'),
        numero_camiseta: 7,
        posicion: 'delantero',
        sancionado: false,
        partidos_sancion_restantes: 0,
        multas_pendientes: false,
        goles_totales: 0,
        tarjetas_amarillas: 0,
        tarjetas_rojas: 0,
        partidos_jugados: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insertar partidos de ejemplo
    await queryInterface.bulkInsert('partidos', [
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        torneo_id: '660e8400-e29b-41d4-a716-446655440001',
        equipo_local_id: '880e8400-e29b-41d4-a716-446655440001',
        equipo_visitante_id: '880e8400-e29b-41d4-a716-446655440002',
        arbitro_id: '770e8400-e29b-41d4-a716-446655440001',
        fecha: new Date('2026-02-15T16:00:00'),
        jornada: 1,
        campo: 'Estadio Municipal',
        estado: 'programado',
        goles_local: 0,
        goles_visitante: 0,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    console.log('✅ Datos iniciales insertados correctamente');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('partidos', null, {});
    await queryInterface.bulkDelete('jugadores', null, {});
    await queryInterface.bulkDelete('equipos', null, {});
    await queryInterface.bulkDelete('arbitros', null, {});
    await queryInterface.bulkDelete('torneos', null, {});
    await queryInterface.bulkDelete('usuarios', null, {});
  }
};
