'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('multas', {
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
        allowNull: true,
        references: {
          model: 'partidos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tipo: {
        type: Sequelize.ENUM(
          'tarjeta_roja',
          'acumulacion_amarillas',
          'conducta_antideportiva',
          'agresion',
          'falta_presentacion',
          'otra'
        ),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      moneda: {
        type: Sequelize.STRING(10),
        defaultValue: 'MXN',
        allowNull: false
      },
      estado_pago: {
        type: Sequelize.ENUM('pendiente', 'pagada', 'vencida', 'perdonada'),
        defaultValue: 'pendiente',
        allowNull: false
      },
      fecha_limite: {
        type: Sequelize.DATE,
        allowNull: true
      },
      fecha_pago: {
        type: Sequelize.DATE,
        allowNull: true
      },
      comprobante_pago: {
        type: Sequelize.STRING(500),
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

    await queryInterface.addIndex('multas', ['jugador_id']);
    await queryInterface.addIndex('multas', ['estado_pago']);
    await queryInterface.addIndex('multas', ['fecha_limite']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('multas');
  }
};
