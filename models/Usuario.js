/**
 * ============================================
 * MODELO: Usuario
 * ============================================
 */

const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
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
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('super_admin', 'admin', 'arbitro', 'delegado', 'jugador'),
      defaultValue: 'jugador',
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    ultimo_acceso: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    paranoid: true, // Soft delete
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
      }
    }
  });

  // Método de instancia para verificar password
  Usuario.prototype.verificarPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Método para ocultar password en respuestas JSON
  Usuario.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.deletedAt;
    return values;
  };

  // Asociaciones
  Usuario.associate = (models) => {
    // Un usuario puede ser un jugador
    Usuario.hasOne(models.Jugador, {
      foreignKey: 'usuario_id',
      as: 'jugador'
    });

    // Un usuario puede ser un árbitro
    Usuario.hasOne(models.Arbitro, {
      foreignKey: 'usuario_id',
      as: 'arbitro'
    });

    // Un usuario puede ser delegado de un equipo
    Usuario.hasOne(models.Equipo, {
      foreignKey: 'delegado_usuario_id',
      as: 'equipoDelegado'
    });

    // Un usuario pertenece a muchas ligas a través de UsuarioLiga
    Usuario.belongsToMany(models.Liga, {
      through: 'usuario_ligas',
      foreignKey: 'usuario_id',
      otherKey: 'liga_id',
      as: 'ligas'
    });

    // Relación directa con UsuarioLiga para acceder a roles
    Usuario.hasMany(models.UsuarioLiga, {
      foreignKey: 'usuario_id',
      as: 'usuario_ligas'
    });
  };

  return Usuario;
};
