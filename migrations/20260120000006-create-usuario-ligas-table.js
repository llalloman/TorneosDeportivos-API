'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear enum para rol_en_liga
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_usuario_ligas_rol_en_liga AS ENUM ('admin_liga', 'delegado', 'arbitro', 'visualizador');
    `);

    await queryInterface.createTable('usuario_ligas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      liga_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ligas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rol_en_liga: {
        type: Sequelize.ENUM('admin_liga', 'delegado', 'arbitro', 'visualizador'),
        allowNull: false
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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

    // Crear constraint único para usuario_id y liga_id
    await queryInterface.addConstraint('usuario_ligas', {
      fields: ['usuario_id', 'liga_id'],
      type: 'unique',
      name: 'usuario_ligas_usuario_id_liga_id_unique'
    });

    // Crear índices
    await queryInterface.addIndex('usuario_ligas', ['liga_id', 'rol_en_liga']);
    await queryInterface.addIndex('usuario_ligas', ['usuario_id', 'activo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('usuario_ligas');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga;');
  }
};
