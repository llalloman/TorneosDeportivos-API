'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la columna ya existe
    const tableDescription = await queryInterface.describeTable('ligas');
    
    if (!tableDescription.slug) {
      // Agregar columna slug como nullable primero
      await queryInterface.addColumn('ligas', 'slug', {
        type: Sequelize.STRING(250),
        allowNull: true
      });
      console.log('Columna slug agregada a tabla ligas');

      // Generar slugs para registros existentes
      const [ligas] = await queryInterface.sequelize.query(
        'SELECT id, nombre FROM ligas WHERE slug IS NULL',
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (ligas && ligas.length > 0) {
        for (const liga of ligas) {
          const slug = liga.nombre
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales
            .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final

          await queryInterface.sequelize.query(
            'UPDATE ligas SET slug = :slug WHERE id = :id',
            {
              replacements: { slug, id: liga.id }
            }
          );
        }
        console.log(`Slugs generados para ${ligas.length} ligas existentes`);
      }

      // Ahora hacer la columna NOT NULL
      await queryInterface.changeColumn('ligas', 'slug', {
        type: Sequelize.STRING(250),
        allowNull: false,
        unique: true
      });
      console.log('Columna slug configurada como NOT NULL y UNIQUE');

      // Crear índice
      try {
        await queryInterface.addIndex('ligas', ['slug'], {
          name: 'ligas_slug',
          unique: true
        });
        console.log('Índice único creado en columna slug');
      } catch (error) {
        console.log('Índice ligas_slug ya existe');
      }
    } else {
      console.log('Columna slug ya existe en tabla ligas');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('ligas');
    if (tableDescription.slug) {
      await queryInterface.removeColumn('ligas', 'slug');
    }
  }
};
