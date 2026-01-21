'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('ligas');
    
    if (!tableDescription.logo_url) {
      await queryInterface.addColumn('ligas', 'logo_url', {
        type: Sequelize.STRING(500),
        allowNull: true,
        after: 'ciudad'
      });
      console.log('Columna logo_url agregada a tabla ligas');
    } else {
      console.log('Columna logo_url ya existe en tabla ligas');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ligas', 'logo_url');
  }
};
