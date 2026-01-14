'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tarjetas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      jugador_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jugadores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      partido_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'partidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('amarilla', 'roja', 'azul'),
        allowNull: false
      },
      minuto: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      motivo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      doble_amarilla: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      procesada: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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

    await queryInterface.addIndex('tarjetas', ['jugador_id']);
    await queryInterface.addIndex('tarjetas', ['partido_id']);
    await queryInterface.addIndex('tarjetas', ['tipo']);
    await queryInterface.addIndex('tarjetas', ['procesada']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tarjetas');
  }
};
