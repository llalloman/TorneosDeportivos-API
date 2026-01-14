'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
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
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      rol: {
        type: Sequelize.ENUM('admin', 'arbitro', 'delegado', 'jugador'),
        defaultValue: 'jugador',
        allowNull: false
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      ultimo_acceso: {
        type: Sequelize.DATE,
        allowNull: true
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
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Índices
    await queryInterface.addIndex('usuarios', ['email']);
    await queryInterface.addIndex('usuarios', ['rol']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  }
};
