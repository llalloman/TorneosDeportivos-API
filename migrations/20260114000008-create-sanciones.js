'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sanciones', {
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
      tipo: {
        type: Sequelize.ENUM(
          'acumulacion_3_amarillas',
          'acumulacion_5_amarillas',
          'tarjeta_roja',
          'conducta_antideportiva',
          'agresion',
          'suspension_indefinida',
          'otra'
        ),
        allowNull: false
      },
      detalle: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      partidos_sancion: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidos_cumplidos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('activa', 'cumplida', 'anulada'),
        defaultValue: 'activa',
        allowNull: false
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      fecha_vencimiento: {
        type: Sequelize.DATE,
        allowNull: true
      },
      indefinida: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      partido_origen_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'partidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tarjeta_origen_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tarjetas',
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

    await queryInterface.addIndex('sanciones', ['jugador_id']);
    await queryInterface.addIndex('sanciones', ['estado']);
    await queryInterface.addIndex('sanciones', ['tipo']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sanciones');
  }
};
