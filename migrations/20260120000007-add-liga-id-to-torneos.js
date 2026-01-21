'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la columna ya existe
    const tableInfo = await queryInterface.describeTable('torneos');
    if (tableInfo.liga_id) {
      console.log('Columna liga_id ya existe en torneos, saltando');
      return;
    }

    // Agregar liga_id a la tabla torneos
    await queryInterface.addColumn('torneos', 'liga_id', {
      type: Sequelize.UUID,
      allowNull: true, // Permitir null temporalmente para datos existentes
      references: {
        model: 'ligas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Crear índice
    await queryInterface.addIndex('torneos', ['liga_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('torneos', 'liga_id');
  }
};
