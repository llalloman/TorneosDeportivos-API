'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero verificar si la tabla existe
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('usuario_ligas')) {
      console.log('Tabla usuario_ligas no existe, saltando actualización de enum');
      return;
    }

    // Actualizar valores existentes de 'delegado' y 'arbitro' a 'operador'
    await queryInterface.sequelize.query(`
      UPDATE usuario_ligas 
      SET rol_en_liga = 'operador' 
      WHERE rol_en_liga IN ('delegado', 'arbitro');
    `);

    // Crear el nuevo tipo enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_usuario_ligas_rol_en_liga_new AS ENUM ('admin_liga', 'operador', 'visualizador');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Cambiar la columna para usar el nuevo tipo enum temporalmente con USING
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_ligas 
      ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga_new 
      USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga_new;
    `);

    // Eliminar el tipo enum antiguo si existe
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga CASCADE;
    `);

    // Renombrar el nuevo tipo enum al nombre original
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuario_ligas_rol_en_liga_new RENAME TO enum_usuario_ligas_rol_en_liga;
    `);

    console.log('Enum rol_en_liga actualizado exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    // Crear el tipo enum antiguo
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE enum_usuario_ligas_rol_en_liga_old AS ENUM ('admin_liga', 'delegado', 'arbitro', 'visualizador');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
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
      DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga CASCADE;
    `);

    // Renombrar el tipo antiguo al nombre original
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuario_ligas_rol_en_liga_old RENAME TO enum_usuario_ligas_rol_en_liga;
    `);
  }
};
