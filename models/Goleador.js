/**
 * ============================================
 * MODELO: Goleador
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Goleador = sequelize.define('Goleador', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jugador_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jugadores',
        key: 'id'
      }
    },
    partido_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'partidos',
        key: 'id'
      }
    },
    minuto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 200
      },
      comment: 'Minuto en que se anotó el gol'
    },
    tipo: {
      type: DataTypes.ENUM('normal', 'penal', 'autogol', 'tiro_libre'),
      defaultValue: 'normal',
      allowNull: false
    },
    asistencia_jugador_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'jugadores',
        key: 'id'
      },
      comment: 'Jugador que dio la asistencia'
    },
    video_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL del video del gol'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'goleadores',
    timestamps: true,
    indexes: [
      {
        fields: ['jugador_id']
      },
      {
        fields: ['partido_id']
      },
      {
        fields: ['tipo']
      }
    ]
  });

  // Asociaciones
  Goleador.associate = (models) => {
    // Un gol pertenece a un jugador
    Goleador.belongsTo(models.Jugador, {
      foreignKey: 'jugador_id',
      as: 'jugador'
    });

    // Un gol pertenece a un partido
    Goleador.belongsTo(models.Partido, {
      foreignKey: 'partido_id',
      as: 'partido'
    });

    // Un gol puede tener una asistencia de otro jugador
    Goleador.belongsTo(models.Jugador, {
      foreignKey: 'asistencia_jugador_id',
      as: 'asistidor'
    });
  };

  return Goleador;
};
