/**
 * ============================================
 * MODELO: Equipo
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Equipo = sequelize.define('Equipo', {
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
    torneo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'torneos',
        key: 'id'
      }
    },
    escudo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    delegado_nombre: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    delegado_usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    delegado_telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    delegado_email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activo', 'inactivo', 'descalificado'),
      defaultValue: 'activo',
      allowNull: false
    },
    // Estadísticas del equipo (calculadas)
    partidos_jugados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partidos_ganados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partidos_empatados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partidos_perdidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    goles_favor: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    goles_contra: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    diferencia_goles: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    puntos: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'equipos',
    timestamps: true,
    indexes: [
      {
        fields: ['torneo_id']
      },
      {
        fields: ['puntos']
      }
    ]
  });

  // Asociaciones
  Equipo.associate = (models) => {
    // Un equipo pertenece a un torneo
    Equipo.belongsTo(models.Torneo, {
      foreignKey: 'torneo_id',
      as: 'torneo'
    });

    // Un equipo tiene un delegado (usuario)
    Equipo.belongsTo(models.Usuario, {
      foreignKey: 'delegado_usuario_id',
      as: 'delegadoUsuario'
    });

    // Un equipo tiene muchos jugadores
    Equipo.hasMany(models.Jugador, {
      foreignKey: 'equipo_id',
      as: 'jugadores'
    });

    // Un equipo juega muchos partidos como local
    Equipo.hasMany(models.Partido, {
      foreignKey: 'equipo_local_id',
      as: 'partidosLocal'
    });

    // Un equipo juega muchos partidos como visitante
    Equipo.hasMany(models.Partido, {
      foreignKey: 'equipo_visitante_id',
      as: 'partidosVisitante'
    });
  };

  return Equipo;
};
