/**
 * ============================================
 * MODELO: UsuarioLiga (Tabla Intermedia)
 * ============================================
 * Relación muchos a muchos entre usuarios y ligas con rol específico por liga
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UsuarioLiga = sequelize.define('UsuarioLiga', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    liga_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ligas',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    rol_en_liga: {
      type: DataTypes.ENUM('admin_liga', 'operador', 'visualizador'),
      allowNull: false,
      defaultValue: 'visualizador',
      comment: 'Rol específico del usuario en esta liga'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'usuario_ligas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['usuario_id', 'liga_id']
      },
      {
        fields: ['liga_id', 'rol_en_liga']
      },
      {
        fields: ['usuario_id', 'activo']
      }
    ]
  });

  UsuarioLiga.associate = (models) => {
    UsuarioLiga.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario'
    });

    UsuarioLiga.belongsTo(models.Liga, {
      foreignKey: 'liga_id',
      as: 'liga'
    });
  };

  return UsuarioLiga;
};
