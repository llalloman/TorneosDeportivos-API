/**
 * ============================================
 * MODELO: Árbitro
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Arbitro = sequelize.define('Arbitro', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    apellido_paterno: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido_materno: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Estadísticas
    partidos_dirigidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    fecha_ultimo_partido: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'arbitros',
    timestamps: true,
    indexes: [
      {
        fields: ['usuario_id']
      },
      {
        fields: ['activo']
      }
    ]
  });

  // Método para obtener nombre completo
  Arbitro.prototype.getNombreCompleto = function() {
    return `${this.nombre} ${this.apellido_paterno} ${this.apellido_materno || ''}`.trim();
  };

  // Asociaciones
  Arbitro.associate = (models) => {
    // Un árbitro puede tener un usuario asociado
    Arbitro.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });

    // Un árbitro dirige muchos partidos
    Arbitro.hasMany(models.Partido, {
      foreignKey: 'arbitro_id',
      as: 'partidos'
    });
  };

  return Arbitro;
};
