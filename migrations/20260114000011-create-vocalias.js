'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vocalias', {
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
      titulo: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      tipo: {
        type: Sequelize.ENUM('anuncio', 'comunicado', 'sancion', 'otro'),
        defaultValue: 'anuncio',
        allowNull: false
      },
      fecha_publicacion: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      visible: {
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

    await queryInterface.addIndex('vocalias', ['torneo_id']);
    await queryInterface.addIndex('vocalias', ['tipo']);
    await queryInterface.addIndex('vocalias', ['visible']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vocalias');
  }
};
