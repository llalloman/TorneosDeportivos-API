'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('torneos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('planificacion', 'en_curso', 'finalizado', 'cancelado'),
        defaultValue: 'planificacion',
        allowNull: false
      },
      tipo: {
        type: Sequelize.ENUM('liga', 'eliminacion', 'grupos'),
        defaultValue: 'liga',
        allowNull: false
      },
      categoria: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      reglamento_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      numero_equipos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    // Índices
    await queryInterface.addIndex('torneos', ['estado']);
    await queryInterface.addIndex('torneos', ['fecha_inicio']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('torneos');
  }
};
