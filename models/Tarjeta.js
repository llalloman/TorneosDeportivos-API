/**
 * ============================================
 * MODELO: Tarjeta
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Tarjeta = sequelize.define('Tarjeta', {
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
    tipo: {
      type: DataTypes.ENUM('amarilla', 'roja', 'azul'),
      allowNull: false,
      comment: 'Tipo de tarjeta mostrada'
    },
    minuto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 200
      },
      comment: 'Minuto del partido en que se mostró la tarjeta'
    },
    motivo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razón por la cual se mostró la tarjeta'
    },
    doble_amarilla: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si la tarjeta roja fue por doble amarilla'
    },
    procesada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Si ya se procesó para acumulación/sanción'
    }
  }, {
    tableName: 'tarjetas',
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
      },
      {
        fields: ['procesada']
      }
    ]
  });

  // Asociaciones
  Tarjeta.associate = (models) => {
    // Una tarjeta pertenece a un jugador
    Tarjeta.belongsTo(models.Jugador, {
      foreignKey: 'jugador_id',
      as: 'jugador'
    });

    // Una tarjeta pertenece a un partido
    Tarjeta.belongsTo(models.Partido, {
      foreignKey: 'partido_id',
      as: 'partido'
    });
  };

  return Tarjeta;
};
