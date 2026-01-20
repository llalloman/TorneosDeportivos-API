'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Agregar super_admin al enum de rol en la tabla usuarios
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuarios_rol ADD VALUE IF NOT EXISTS 'super_admin';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // No se puede eliminar un valor de un ENUM en PostgreSQL sin recrear el tipo
    // Esto requeriría recrear la tabla, lo cual es complejo
    console.log('Revertir la adición de super_admin al enum requiere recrear el tipo, operación no implementada');
  }
};
