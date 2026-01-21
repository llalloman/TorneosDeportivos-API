'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la tabla ya existe
    const tables = await queryInterface.showAllTables();
    if (tables.includes('ligas')) {
      console.log('Tabla ligas ya existe, saltando creación');
      return;
    }

    await queryInterface.createTable('ligas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pais: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      ciudad: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      activa: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      configuracion: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Crear índices solo si no existen
    try {
      await queryInterface.addIndex('ligas', ['nombre'], {
        name: 'ligas_nombre',
        unique: false
      });
    } catch (error) {
      console.log('Índice ligas_nombre ya existe');
    }

    try {
      await queryInterface.addIndex('ligas', ['activa'], {
        name: 'ligas_activa',
        unique: false
      });
    } catch (error) {
      console.log('Índice ligas_activa ya existe');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ligas');
  }
};
