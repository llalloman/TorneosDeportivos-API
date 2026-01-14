'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipos', {
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
      escudo_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      delegado_nombre: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      delegado_telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      delegado_email: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      delegado_usuario_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo', 'descalificado'),
        defaultValue: 'activo',
        allowNull: false
      },
      partidos_jugados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidos_ganados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidos_empatados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidos_perdidos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      puntos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      goles_favor: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      goles_contra: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      diferencia_goles: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('equipos', ['torneo_id']);
    await queryInterface.addIndex('equipos', ['estado']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('equipos');
  }
};
