/**
 * ============================================
 * MODELO: Liga / Organización
 * ============================================
 * Representa una liga u organización deportiva que puede tener múltiples torneos
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Liga = sequelize.define('Liga', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la liga es requerido' },
        len: { args: [3, 200], msg: 'El nombre debe tener entre 3 y 200 caracteres' }
      }
    },
    slug: {
      type: DataTypes.STRING(250),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El slug es requerido' }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: { msg: 'Debe ser una URL válida' }
      }
    },
    pais: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    ciudad: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    configuracion: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
      comment: 'Configuración específica de la liga (colores, reglas especiales, etc.)'
    }
  }, {
    tableName: 'ligas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['nombre']
      },
      {
        fields: ['activa']
      }
    ]
  });

  Liga.associate = (models) => {
    // Una liga tiene muchos torneos
    Liga.hasMany(models.Torneo, {
      foreignKey: 'liga_id',
      as: 'torneos'
    });

    // Una liga tiene muchos usuarios a través de UsuarioLiga
    Liga.belongsToMany(models.Usuario, {
      through: 'usuario_ligas',
      foreignKey: 'liga_id',
      otherKey: 'usuario_id',
      as: 'usuarios'
    });
  };

  return Liga;
};
