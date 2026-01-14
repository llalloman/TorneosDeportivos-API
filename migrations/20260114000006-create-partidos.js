'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('partidos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      torneo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'torneos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipo_local_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      equipo_visitante_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      arbitro_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'arbitros',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false
      },
      jornada: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      campo: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('programado', 'en_curso', 'finalizado', 'suspendido', 'cancelado'),
        defaultValue: 'programado',
        allowNull: false
      },
      goles_local: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      goles_visitante: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      penales_local: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      penales_visitante: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
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
      }
    });

    await queryInterface.addIndex('partidos', ['torneo_id']);
    await queryInterface.addIndex('partidos', ['equipo_local_id']);
    await queryInterface.addIndex('partidos', ['equipo_visitante_id']);
    await queryInterface.addIndex('partidos', ['fecha']);
    await queryInterface.addIndex('partidos', ['estado']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('partidos');
  }
};
