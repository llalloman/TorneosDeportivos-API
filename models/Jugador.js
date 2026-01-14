/**
 * ============================================
 * MODELO: Jugador
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Jugador = sequelize.define('Jugador', {
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
    equipo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'equipos',
        key: 'id'
      }
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    numero_camiseta: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 999
      }
    },
    posicion: {
      type: DataTypes.ENUM('portero', 'defensa', 'medio', 'delantero'),
      allowNull: true
    },
    // Estadísticas del jugador
    goles_totales: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tarjetas_amarillas: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    tarjetas_rojas: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    partidos_jugados: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Control disciplinario
    sancionado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si está actualmente sancionado'
    },
    partidos_sancion_restantes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Partidos que le quedan por cumplir de sanción'
    },
    multas_pendientes: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si tiene multas sin pagar'
    }
  }, {
    tableName: 'jugadores',
    timestamps: true,
    indexes: [
      {
        fields: ['equipo_id']
      },
      {
        fields: ['sancionado']
      }
    ]
  });

  // Método para obtener nombre completo
  Jugador.prototype.getNombreCompleto = function() {
    return `${this.nombre} ${this.apellido_paterno} ${this.apellido_materno || ''}`.trim();
  };

  // Método para calcular edad
  Jugador.prototype.getEdad = function() {
    if (!this.fecha_nacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(this.fecha_nacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // Asociaciones
  Jugador.associate = (models) => {
    // Un jugador pertenece a un equipo
    Jugador.belongsTo(models.Equipo, {
      foreignKey: 'equipo_id',
      as: 'equipo'
    });

    // Un jugador puede tener un usuario asociado
    Jugador.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });

    // Un jugador tiene muchos goles
    Jugador.hasMany(models.Goleador, {
      foreignKey: 'jugador_id',
      as: 'goles'
    });

    // Un jugador tiene muchas tarjetas
    Jugador.hasMany(models.Tarjeta, {
      foreignKey: 'jugador_id',
      as: 'tarjetas'
    });

    // Un jugador tiene muchas sanciones
    Jugador.hasMany(models.Sancion, {
      foreignKey: 'jugador_id',
      as: 'sanciones'
    });

    // Un jugador tiene muchas multas
    Jugador.hasMany(models.Multa, {
      foreignKey: 'jugador_id',
      as: 'multas'
    });
  };

  return Jugador;
};
