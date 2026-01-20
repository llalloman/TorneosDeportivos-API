/**
 * ============================================
 * MODELO: Torneo
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Torneo = sequelize.define('Torneo', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    liga_id: {
      type: DataTypes.UUID,
      allowNull: true, // Permitir null para migraciones existentes
      references: {
        model: 'ligas',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Liga a la que pertenece este torneo'
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 150]
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fecha_fin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('planificacion', 'en_curso', 'finalizado', 'cancelado'),
      defaultValue: 'planificacion',
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('liga', 'eliminacion', 'grupos'),
      defaultValue: 'liga',
      allowNull: false
    },
    categoria: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Libre, Sub-17, Veteranos, etc.'
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reglamento_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    numero_equipos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    configuracion: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Configuración adicional: puntos por victoria, empate, etc.'
    }
  }, {
    tableName: 'torneos',
    timestamps: true,
    indexes: [
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_inicio']
      }
    ]
  });

  // Asociaciones
  Torneo.associate = (models) => {
    // Un torneo pertenece a una liga
    Torneo.belongsTo(models.Liga, {
      foreignKey: 'liga_id',
      as: 'liga'
    });

    // Un torneo tiene muchos equipos
    Torneo.hasMany(models.Equipo, {
      foreignKey: 'torneo_id',
      as: 'equipos'
    });

    // Un torneo tiene muchos partidos
    Torneo.hasMany(models.Partido, {
      foreignKey: 'torneo_id',
      as: 'partidos'
    });

    // Un torneo tiene muchas vocalías
    Torneo.hasMany(models.Vocalia, {
      foreignKey: 'torneo_id',
      as: 'vocalias'
    });
  };

  return Torneo;
};
