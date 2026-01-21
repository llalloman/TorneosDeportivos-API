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

    // Cambiar el tipo de la columna al nuevo enum
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_ligas 
      DROP CONSTRAINT IF EXISTS usuario_ligas_rol_en_liga_check;
    `);

    await queryInterface.changeColumn('usuario_ligas', 'rol_en_liga', {
      type: Sequelize.ENUM('admin_liga', 'operador', 'visualizador'),
      allowNull: false,
      defaultValue: 'visualizador'
    });

    console.log('Enum rol_en_liga actualizado exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_ligas 
      DROP CONSTRAINT IF EXISTS usuario_ligas_rol_en_liga_check;
    `);

    await queryInterface.changeColumn('usuario_ligas', 'rol_en_liga', {
      type: Sequelize.ENUM('admin_liga', 'delegado', 'arbitro', 'visualizador'),
      allowNull: false,
      defaultValue: 'visualizador'
    });
  }
};
