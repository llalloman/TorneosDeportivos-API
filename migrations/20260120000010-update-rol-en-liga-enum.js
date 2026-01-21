'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si la tabla existe
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('usuario_ligas')) {
      console.log('Tabla usuario_ligas no existe, saltando actualización de enum');
      return;
    }

    // Verificar si la columna rol_en_liga existe
    const tableDescription = await queryInterface.describeTable('usuario_ligas');
    
    if (!tableDescription.rol_en_liga) {
      console.log('Columna rol_en_liga no existe, creándola...');
      
      // Verificar si el tipo enum ya existe
      const [enumExists] = await queryInterface.sequelize.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'enum_usuario_ligas_rol_en_liga'
        ) as exists;
      `);

      if (!enumExists[0].exists) {
        // Crear el enum solo si no existe
        await queryInterface.sequelize.query(`
          CREATE TYPE enum_usuario_ligas_rol_en_liga AS ENUM ('admin_liga', 'operador', 'visualizador');
        `);
        console.log('Enum creado');
      } else {
        console.log('Enum ya existe, verificando valores...');
        
        // Obtener los valores actuales del enum
        const [enumValues] = await queryInterface.sequelize.query(`
          SELECT e.enumlabel
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'enum_usuario_ligas_rol_en_liga';
        `);
        
        const currentValues = enumValues.map(v => v.enumlabel);
        console.log('Valores actuales del enum:', currentValues);
        
        // Si el enum tiene valores antiguos, recrearlo
        if (currentValues.includes('delegado') || currentValues.includes('arbitro')) {
          console.log('Enum tiene valores antiguos, recreándolo...');
          
          await queryInterface.sequelize.query(`
            DROP TYPE enum_usuario_ligas_rol_en_liga CASCADE;
          `);
          
          await queryInterface.sequelize.query(`
            CREATE TYPE enum_usuario_ligas_rol_en_liga AS ENUM ('admin_liga', 'operador', 'visualizador');
          `);
          console.log('Enum recreado con valores correctos');
        } else if (!currentValues.includes('operador')) {
          // Si no tiene 'operador', agregarlo
          await queryInterface.sequelize.query(`
            ALTER TYPE enum_usuario_ligas_rol_en_liga ADD VALUE 'operador';
          `);
          console.log('Valor operador agregado al enum');
        }
      }

      // Agregar la columna
      await queryInterface.addColumn('usuario_ligas', 'rol_en_liga', {
        type: Sequelize.ENUM('admin_liga', 'operador', 'visualizador'),
        allowNull: false,
        defaultValue: 'visualizador'
      });

      console.log('Columna rol_en_liga creada exitosamente');
      return;
    }

    // Si la columna ya existe, verificar si necesitamos actualizar el enum
    console.log('Columna rol_en_liga ya existe, verificando enum...');
    
    // Verificar si hay registros en la tabla
    const [results] = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM usuario_ligas'
    );
    const hasRecords = parseInt(results[0].count) > 0;

    // Obtener los valores actuales del enum
    const [enumValues] = await queryInterface.sequelize.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'enum_usuario_ligas_rol_en_liga';
    `);
    
    const currentValues = enumValues.map(v => v.enumlabel);
    console.log('Valores actuales del enum:', currentValues);

    // Si ya tiene los valores correctos, salir
    if (currentValues.includes('operador') && 
        !currentValues.includes('delegado') && 
        !currentValues.includes('arbitro')) {
      console.log('Enum ya tiene los valores correctos, nada que hacer');
      return;
    }

    if (!hasRecords) {
      // Si no hay registros, recrear el enum
      console.log('No hay registros, recreando enum...');
      
      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas ALTER COLUMN rol_en_liga DROP DEFAULT;
      `);

      await queryInterface.sequelize.query(`
        DROP TYPE enum_usuario_ligas_rol_en_liga CASCADE;
      `);

      await queryInterface.sequelize.query(`
        CREATE TYPE enum_usuario_ligas_rol_en_liga AS ENUM ('admin_liga', 'operador', 'visualizador');
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas 
        ADD COLUMN rol_en_liga_new enum_usuario_ligas_rol_en_liga DEFAULT 'visualizador';
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas DROP COLUMN rol_en_liga;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas RENAME COLUMN rol_en_liga_new TO rol_en_liga;
      `);

      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas ALTER COLUMN rol_en_liga SET NOT NULL;
      `);
    } else {
      // Si hay registros, hacer migración compleja
      console.log('Hay registros, haciendo migración compleja...');
      
      // Paso 1: Agregar 'operador' al enum si no existe
      if (!currentValues.includes('operador')) {
        await queryInterface.sequelize.query(`
          ALTER TYPE enum_usuario_ligas_rol_en_liga ADD VALUE 'operador';
        `);
        console.log('Valor operador agregado');
      }

      // Paso 2: Actualizar valores existentes
      await queryInterface.sequelize.query(`
        UPDATE usuario_ligas 
        SET rol_en_liga = 'operador' 
        WHERE rol_en_liga IN ('delegado', 'arbitro');
      `);
      console.log('Valores actualizados');

      // Paso 3: Crear nuevo tipo enum sin los valores antiguos
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga_new;
      `);
      
      await queryInterface.sequelize.query(`
        CREATE TYPE enum_usuario_ligas_rol_en_liga_new AS ENUM ('admin_liga', 'operador', 'visualizador');
      `);

      // Paso 4: Cambiar la columna al nuevo tipo
      await queryInterface.sequelize.query(`
        ALTER TABLE usuario_ligas 
        ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga_new 
        USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga_new;
      `);

      // Paso 5: Eliminar el enum antiguo
      await queryInterface.sequelize.query(`
        DROP TYPE enum_usuario_ligas_rol_en_liga;
      `);

      // Paso 6: Renombrar el nuevo enum
      await queryInterface.sequelize.query(`
        ALTER TYPE enum_usuario_ligas_rol_en_liga_new RENAME TO enum_usuario_ligas_rol_en_liga;
      `);
    }

    console.log('Enum rol_en_liga actualizado exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('usuario_ligas')) {
      return;
    }

    const tableDescription = await queryInterface.describeTable('usuario_ligas');
    if (!tableDescription.rol_en_liga) {
      console.log('Columna rol_en_liga no existe, saltando rollback');
      return;
    }

    // Crear el tipo enum antiguo
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga_old;
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE enum_usuario_ligas_rol_en_liga_old AS ENUM ('admin_liga', 'delegado', 'arbitro', 'visualizador');
    `);

    // Cambiar valores de 'operador' a 'delegado' para rollback
    await queryInterface.sequelize.query(`
      UPDATE usuario_ligas 
      SET rol_en_liga = 'delegado' 
      WHERE rol_en_liga = 'operador';
    `);

    // Cambiar la columna al tipo antiguo
    await queryInterface.sequelize.query(`
      ALTER TABLE usuario_ligas 
      ALTER COLUMN rol_en_liga TYPE enum_usuario_ligas_rol_en_liga_old 
      USING rol_en_liga::text::enum_usuario_ligas_rol_en_liga_old;
    `);

    // Eliminar el tipo enum nuevo
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_usuario_ligas_rol_en_liga;
    `);

    // Renombrar el tipo antiguo al nombre original
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_usuario_ligas_rol_en_liga_old RENAME TO enum_usuario_ligas_rol_en_liga;
    `);
  }
};
