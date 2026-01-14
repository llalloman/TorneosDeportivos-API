'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('arbitros', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido_paterno: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      apellido_materno: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      foto: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      licencia: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      nivel: {
        type: Sequelize.STRING(50),
        allowNull: true
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

    await queryInterface.addIndex('arbitros', ['activo']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('arbitros');
  }
};
