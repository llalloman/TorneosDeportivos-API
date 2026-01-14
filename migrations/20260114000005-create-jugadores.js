'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
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
      equipo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'equipos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      fecha_nacimiento: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      numero_camiseta: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      posicion: {
        type: Sequelize.ENUM('portero', 'defensa', 'medio', 'delantero'),
        allowNull: true
      },
      foto: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      documento_identidad: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('activo', 'sancionado', 'baja', 'lesionado'),
        defaultValue: 'activo',
        allowNull: false
      },
      sancionado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      partidos_sancion_restantes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      multas_pendientes: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      goles_totales: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      asistencias_totales: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      tarjetas_amarillas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      tarjetas_rojas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      partidos_jugados: {
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

    await queryInterface.addIndex('jugadores', ['equipo_id']);
    await queryInterface.addIndex('jugadores', ['estado']);
    await queryInterface.addIndex('jugadores', ['sancionado']);
    await queryInterface.addIndex('jugadores', ['documento_identidad']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jugadores');
  }
};
