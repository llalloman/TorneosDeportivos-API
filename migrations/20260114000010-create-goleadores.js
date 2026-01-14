'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('goleadores', {
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
      minuto: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      tipo: {
        type: Sequelize.ENUM('gol', 'penal', 'tiro_libre', 'autogol'),
        defaultValue: 'gol',
        allowNull: false
      },
      asistencia_jugador_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'jugadores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('goleadores', ['jugador_id']);
    await queryInterface.addIndex('goleadores', ['partido_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('goleadores');
  }
};
