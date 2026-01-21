'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero verificar si la tabla existe
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('usuario_ligas')) {
      console.log('Tabla usuario_ligas no existe, saltando actualización de enum');
      return;
    }

    // Verificar si hay registros en la tabla
    const [results] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM usuario_ligas'
    );
    const hasRecords = parseInt(results[0].count) > 0;

    if (!hasRecords) {
      // Si no hay registros, simplemente recrear el enum
      console.log('No hay registros, recreando enum...');
      
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga CASCADE;
      `);

      await queryInterface.sequelize.query(`
        CREATE TYPE enum_usuario_ligas_rol_en_liga AS ENUM ('admin_liga', 'operador', 'visualizador');
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas 
        ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga 
        USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas 
        ALTER COLUMN rol_en_liga SET DEFAULT 'visualizador';
      `);
    } else {
      // Si hay registros, hacer migración compleja
      console.log('Hay registros, haciendo migración compleja...');
      
      // Paso 1: Agregar 'operador' al enum existente
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_usuario_ligas_rol_en_liga ADD VALUE IF NOT EXISTS 'operador';
      `);

      // Paso 2: Actualizar valores existentes
      await queryInterface.sequelize.query(`
        UPDATE usuario_ligas 
        SET rol_en_liga = 'operador' 
        WHERE rol_en_liga IN ('delegado', 'arbitro');
      `);

      // Paso 3: Crear nuevo tipo enum sin los valores antiguos
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_usuario_ligas_rol_en_liga_new AS ENUM ('admin_liga', 'operador', 'visualizador');
      `);

      // Paso 4: Cambiar la columna al nuevo tipo
      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas 
        ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga_new 
        USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga_new;
      `);

      // Paso 5: Eliminar el enum antiguo
      await queryInterface.sequelize.query(`
        DROP TYPE enum_usuario_ligas_rol_en_liga;
      `);

      // Paso 6: Renombrar el nuevo enum
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_usuario_ligas_rol_en_liga_new RENAME TO enum_usuario_ligas_rol_en_liga;
      `);
    }

    console.log('Enum rol_en_liga actualizado exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    // Crear el tipo enum antiguo
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_usuario_ligas_rol_en_liga_old AS ENUM ('admin_liga', 'delegado', 'arbitro', 'visualizador');
    `);

    // Cambiar valores de 'operador' a 'delegado' para rollback
    await queryInterface.sequelize.query(`
      UPDATE usuario_ligas 
      SET rol_en_liga = 'delegado' 
      WHERE rol_en_liga = 'operador';
    `);

    // Cambiar la columna al tipo antiguo
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_ligas 
      ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga_old 
      USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga_old;
    `);

    // Eliminar el tipo enum nuevo
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga;
    `);

    // Renombrar el tipo antiguo al nombre original
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuario_ligas_rol_en_liga_old RENAME TO enum_usuario_ligas_rol_en_liga;
    `);
  }
};
