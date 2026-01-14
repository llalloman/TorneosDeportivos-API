/**
 * ============================================
 * MODELO: Partido
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Partido = sequelize.define('Partido', {
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
    equipo_local_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'equipos',
        key: 'id'
      }
    },
    equipo_visitante_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'equipos',
        key: 'id'
      }
    },
    arbitro_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'arbitros',
        key: 'id'
      }
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    jornada: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Número de jornada del torneo'
    },
    campo: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: 'Ubicación o nombre del campo de juego'
    },
    estado: {
      type: DataTypes.ENUM('programado', 'en_curso', 'finalizado', 'suspendido', 'cancelado'),
      defaultValue: 'programado',
      allowNull: false
    },
    // Resultados
    goles_local: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    goles_visitante: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Penales (si aplica)
    penales_local: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    penales_visitante: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Observaciones
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Incidencias, comentarios del árbitro, etc.'
    }
  }, {
    tableName: 'partidos',
    timestamps: true,
    indexes: [
      {
        fields: ['torneo_id']
      },
      {
        fields: ['equipo_local_id']
      },
      {
        fields: ['equipo_visitante_id']
      },
      {
        fields: ['fecha']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['arbitro_id']
      }
    ],
    validate: {
      equiposDiferentes() {
        if (this.equipo_local_id === this.equipo_visitante_id) {
          throw new Error('El equipo local y visitante no pueden ser el mismo');
        }
      }
    }
  });

  // Método para determinar ganador
  Partido.prototype.getGanador = function() {
    if (this.estado !== 'finalizado') return null;
    if (this.goles_local > this.goles_visitante) return 'local';
    if (this.goles_visitante > this.goles_local) return 'visitante';
    if (this.penales_local && this.penales_visitante) {
      if (this.penales_local > this.penales_visitante) return 'local';
      if (this.penales_visitante > this.penales_local) return 'visitante';
    }
    return 'empate';
  };

  // Asociaciones
  Partido.associate = (models) => {
    // Un partido pertenece a un torneo
    Partido.belongsTo(models.Torneo, {
      foreignKey: 'torneo_id',
      as: 'torneo'
    });

    // Un partido tiene un equipo local
    Partido.belongsTo(models.Equipo, {
      foreignKey: 'equipo_local_id',
      as: 'equipoLocal'
    });

    // Un partido tiene un equipo visitante
    Partido.belongsTo(models.Equipo, {
      foreignKey: 'equipo_visitante_id',
      as: 'equipoVisitante'
    });

    // Un partido tiene un árbitro
    Partido.belongsTo(models.Arbitro, {
      foreignKey: 'arbitro_id',
      as: 'arbitro'
    });

    // Un partido tiene muchos goles
    Partido.hasMany(models.Goleador, {
      foreignKey: 'partido_id',
      as: 'goles'
    });

    // Un partido tiene muchas tarjetas
    Partido.hasMany(models.Tarjeta, {
      foreignKey: 'partido_id',
      as: 'tarjetas'
    });

    // Un partido puede generar multas
    Partido.hasMany(models.Multa, {
      foreignKey: 'partido_id',
      as: 'multas'
    });
  };

  return Partido;
};
