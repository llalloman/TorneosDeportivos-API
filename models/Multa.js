/**
 * ============================================
 * MODELO: Multa
 * ============================================
 */

module.exports = (sequelize, DataTypes) => {
  const Multa = sequelize.define('Multa', {
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
      allowNull: true,
      references: {
        model: 'partidos',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM(
        'tarjeta_roja',
        'acumulacion_amarillas',
        'conducta_antideportiva',
        'agresion',
        'falta_presentacion',
        'otra'
      ),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    moneda: {
      type: DataTypes.STRING(10),
      defaultValue: 'MXN',
      allowNull: false
    },
    estado_pago: {
      type: DataTypes.ENUM('pendiente', 'pagada', 'condonada', 'vencida'),
      defaultValue: 'pendiente',
      allowNull: false
    },
    fecha_limite_pago: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha límite para realizar el pago'
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha en que se realizó el pago'
    },
    metodo_pago: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Efectivo, transferencia, tarjeta, etc.'
    },
    referencia_pago: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Número de referencia o comprobante'
    },
    comprobante_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL del comprobante de pago'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    registrada_por: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    }
  }, {
    tableName: 'multas',
    timestamps: true,
    indexes: [
      {
        fields: ['jugador_id']
      },
      {
        fields: ['partido_id']
      },
      {
        fields: ['estado_pago']
      },
      {
        fields: ['fecha_limite_pago']
      }
    ]
  });

  // Método para registrar pago
  Multa.prototype.registrarPago = async function(metodoPago, referencia, comprobanteUrl) {
    this.estado_pago = 'pagada';
    this.fecha_pago = new Date();
    this.metodo_pago = metodoPago;
    this.referencia_pago = referencia;
    if (comprobanteUrl) {
      this.comprobante_url = comprobanteUrl;
    }
    await this.save();
  };

  // Método para verificar si está vencida
  Multa.prototype.verificarVencimiento = async function() {
    if (this.estado_pago === 'pendiente' && this.fecha_limite_pago) {
      if (new Date() > new Date(this.fecha_limite_pago)) {
        this.estado_pago = 'vencida';
        await this.save();
      }
    }
  };

  // Asociaciones
  Multa.associate = (models) => {
    // Una multa pertenece a un jugador
    Multa.belongsTo(models.Jugador, {
      foreignKey: 'jugador_id',
      as: 'jugador'
    });

    // Una multa puede estar asociada a un partido
    Multa.belongsTo(models.Partido, {
      foreignKey: 'partido_id',
      as: 'partido'
    });

    // Una multa puede ser registrada por un usuario
    Multa.belongsTo(models.Usuario, {
      foreignKey: 'registrada_por',
      as: 'registrador'
    });
  };

  return Multa;
};
