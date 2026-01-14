/**
 * ============================================
 * MODELO: Sanción
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Sancion = sequelize.define('Sancion', {
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
    tipo: {
      type: DataTypes.ENUM(
        'acumulacion_3_amarillas',
        'acumulacion_5_amarillas',
        'tarjeta_roja',
        'conducta_antideportiva',
        'agresion',
        'suspension_indefinida',
        'otra'
      ),
      allowNull: false
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada de la sanción'
    },
    partidos_sancion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Número de partidos de suspensión'
    },
    partidos_cumplidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Partidos ya cumplidos de la sanción'
    },
    estado: {
      type: DataTypes.ENUM('activa', 'cumplida', 'anulada'),
      defaultValue: 'activa',
      allowNull: false
    },
    fecha_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_vencimiento: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha estimada de finalización (puede cambiar según calendario)'
    },
    indefinida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si la sanción no tiene fecha de término definida'
    },
    // Referencia al partido/tarjeta origen
    partido_origen_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'partidos',
        key: 'id'
      }
    },
    tarjeta_origen_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'tarjetas',
        key: 'id'
      }
    },
    // Aprobación
    aprobada_por: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      comment: 'Usuario administrador que aprobó la sanción'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sanciones',
    timestamps: true,
    indexes: [
      {
        fields: ['jugador_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['tipo']
      },
      {
        fields: ['partido_origen_id']
      }
    ]
  });

  // Método para verificar si la sanción está activa
  Sancion.prototype.estaActiva = function() {
    return this.estado === 'activa' && this.partidos_cumplidos < this.partidos_sancion;
  };

  // Método para registrar cumplimiento de partido
  Sancion.prototype.cumplirPartido = async function() {
    if (this.partidos_cumplidos < this.partidos_sancion) {
      this.partidos_cumplidos += 1;
      if (this.partidos_cumplidos >= this.partidos_sancion) {
        this.estado = 'cumplida';
      }
      await this.save();
    }
  };

  // Asociaciones
  Sancion.associate = (models) => {
    // Una sanción pertenece a un jugador
    Sancion.belongsTo(models.Jugador, {
      foreignKey: 'jugador_id',
      as: 'jugador'
    });

    // Una sanción puede tener un partido origen
    Sancion.belongsTo(models.Partido, {
      foreignKey: 'partido_origen_id',
      as: 'partidoOrigen'
    });

    // Una sanción puede tener una tarjeta origen
    Sancion.belongsTo(models.Tarjeta, {
      foreignKey: 'tarjeta_origen_id',
      as: 'tarjetaOrigen'
    });

    // Una sanción puede ser aprobada por un usuario
    Sancion.belongsTo(models.Usuario, {
      foreignKey: 'aprobada_por',
      as: 'aprobador'
    });
  };

  return Sancion;
};
