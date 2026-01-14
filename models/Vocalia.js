/**
 * ============================================
 * MODELO: Vocalía
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Vocalia = sequelize.define('Vocalia', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    torneo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'torneos',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    cargo: {
      type: DataTypes.ENUM(
        'presidente',
        'vicepresidente',
        'secretario',
        'tesorero',
        'vocal',
        'comisionado_disciplina',
        'otro'
      ),
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    foto: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    periodo_inicio: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Inicio del periodo de gestión'
    },
    periodo_fin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fin del periodo de gestión'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    biografia: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'vocalias',
    timestamps: true,
    indexes: [
      {
        fields: ['torneo_id']
      },
      {
        fields: ['cargo']
      },
      {
        fields: ['activo']
      }
    ]
  });

  // Asociaciones
  Vocalia.associate = (models) => {
    // Una vocalía pertenece a un torneo
    Vocalia.belongsTo(models.Torneo, {
      foreignKey: 'torneo_id',
      as: 'torneo'
    });
  };

  return Vocalia;
};
