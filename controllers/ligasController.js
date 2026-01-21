/**
 * ============================================
 * CONTROLADOR: Ligas
 * ============================================
 */

const { Liga, Usuario, UsuarioLiga, Torneo } = require('../models');
const { Op } = require('sequelize');

/**
 * Obtener todas las ligas (super_admin ve todas, otros solo las suyas)
 */
exports.getLigas = async (req, res, next) => {
  try {
    const { activa, pais, ciudad } = req.query;
    const userId = req.usuario.id;
    const userRole = req.usuario.rol;

    let where = {};
    
    // Filtros opcionales
    if (activa !== undefined) where.activa = activa === 'true';
    if (pais) where.pais = { [Op.iLike]: `%${pais}%` };
    if (ciudad) where.ciudad = { [Op.iLike]: `%${ciudad}%` };

    let ligas;

    if (userRole === 'super_admin') {
      // Super admin ve todas las ligas (sin includes para evitar errores)
      ligas = await Liga.findAll({
        where,
        order: [['created_at', 'DESC']]
      });
    } else {
      // Otros usuarios ven sus ligas (simplificado)
      const usuarioLigas = await UsuarioLiga.findAll({
        where: { 
          usuario_id: userId,
          activo: true 
        },
        include: [{
          model: Liga,
          as: 'liga',
          where
        }]
      });
      
      ligas = usuarioLigas.map(ul => ul.liga);
    }

    res.json({
      success: true,
      data: ligas
    });
  } catch (error) {
    console.error('Error en getLigas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ligas',
      error: error.message
    });
  }
};

/**
 * Obtener una liga por ID
 */
exports.getLigaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.usuario.id;
    const userRole = req.usuario.rol;

    const liga = await Liga.findByPk(id, {
      include: [
        {
          model: Torneo,
          as: 'torneos',
          attributes: ['id', 'nombre', 'estado', 'fecha_inicio', 'fecha_fin']
        }
      ]
    });

    if (!liga) {
      return res.status(404).json({
        success: false,
        message: 'Liga no encontrada'
      });
    }

    // Verificar acceso si no es super_admin
    if (userRole !== 'super_admin') {
      const usuarioLiga = await UsuarioLiga.findOne({
        where: {
          usuario_id: userId,
          liga_id: id,
          activo: true
        }
      });

      if (!usuarioLiga) {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta liga'
        });
      }
    }

    res.json({
      success: true,
      data: liga
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crear una nueva liga (solo super_admin)
 */
exports.createLiga = async (req, res, next) => {
  try {
    const { nombre, descripcion, logo_url, pais, ciudad, configuracion } = req.body;
    const userRole = req.usuario.rol;

    if (userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los super administradores pueden crear ligas'
      });
    }

    // Generar slug a partir del nombre
    const slug = nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres especiales con guiones
      .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final

    const liga = await Liga.create({
      nombre,
      slug,
      descripcion,
      logo_url,
      pais,
      ciudad,
      configuracion: configuracion || {}
    });

    res.status(201).json({
      success: true,
      message: 'Liga creada exitosamente',
      data: liga
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar una liga
 */
exports.updateLiga = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, logo_url, pais, ciudad, activa, configuracion } = req.body;
    const userId = req.usuario.id;
    const userRole = req.usuario.rol;

    const liga = await Liga.findByPk(id);

    if (!liga) {
      return res.status(404).json({
        success: false,
        message: 'Liga no encontrada'
      });
    }

    // Verificar permisos
    if (userRole !== 'super_admin') {
      const usuarioLiga = await UsuarioLiga.findOne({
        where: {
          usuario_id: userId,
          liga_id: id,
          rol_en_liga: 'admin_liga',
          activo: true
        }
      });

      if (!usuarioLiga) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para actualizar esta liga'
        });
      }
    }

    // Generar nuevo slug si se actualiza el nombre
    const updateData = {
      nombre,
      descripcion,
      logo_url,
      pais,
      ciudad,
      activa,
      configuracion
    };

    if (nombre && nombre !== liga.nombre) {
      updateData.slug = nombre
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    await liga.update(updateData);

    res.json({
      success: true,
      message: 'Liga actualizada exitosamente',
      data: liga
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar una liga (solo super_admin)
 */
exports.deleteLiga = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userRole = req.usuario.rol;

    if (userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los super administradores pueden eliminar ligas'
      });
    }

    const liga = await Liga.findByPk(id);

    if (!liga) {
      return res.status(404).json({
        success: false,
        message: 'Liga no encontrada'
      });
    }

    await liga.destroy();

    res.json({
      success: true,
      message: 'Liga eliminada exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Agregar usuario a una liga
 */
exports.addUsuarioToLiga = async (req, res, next) => {
  try {
    const { id } = req.params; // liga_id
    const { usuario_id, rol_en_liga } = req.body;
    const userRole = req.usuario.rol;
    const currentUserId = req.usuario.id;

    // Verificar permisos
    if (userRole !== 'super_admin') {
      const usuarioLiga = await UsuarioLiga.findOne({
        where: {
          usuario_id: currentUserId,
          liga_id: id,
          rol_en_liga: 'admin_liga',
          activo: true
        }
      });

      if (!usuarioLiga) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para agregar usuarios a esta liga'
        });
      }
    }

    // Verificar que la liga existe
    const liga = await Liga.findByPk(id);
    if (!liga) {
      return res.status(404).json({
        success: false,
        message: 'Liga no encontrada'
      });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar si ya existe la relación
    const existente = await UsuarioLiga.findOne({
      where: {
        usuario_id,
        liga_id: id
      }
    });

    if (existente) {
      // Actualizar si existe
      await existente.update({
        rol_en_liga,
        activo: true
      });

      return res.json({
        success: true,
        message: 'Usuario actualizado en la liga',
        data: existente
      });
    }

    // Crear nueva relación
    const usuarioLiga = await UsuarioLiga.create({
      usuario_id,
      liga_id: id,
      rol_en_liga
    });

    res.status(201).json({
      success: true,
      message: 'Usuario agregado a la liga exitosamente',
      data: usuarioLiga
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtener usuarios de una liga
 */
exports.getUsuariosLiga = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rol_en_liga, activo } = req.query;

    let where = { liga_id: id };
    if (rol_en_liga) where.rol_en_liga = rol_en_liga;
    if (activo !== undefined) where.activo = activo === 'true';

    const usuariosLiga = await UsuarioLiga.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email', 'rol']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: usuariosLiga
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remover usuario de una liga
 */
exports.removeUsuarioFromLiga = async (req, res, next) => {
  try {
    const { id, usuario_id } = req.params;
    const userRole = req.usuario.rol;
    const currentUserId = req.usuario.id;

    // Verificar permisos
    if (userRole !== 'super_admin') {
      const usuarioLiga = await UsuarioLiga.findOne({
        where: {
          usuario_id: currentUserId,
          liga_id: id,
          rol_en_liga: 'admin_liga',
          activo: true
        }
      });

      if (!usuarioLiga) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para remover usuarios de esta liga'
        });
      }
    }

    const usuarioLiga = await UsuarioLiga.findOne({
      where: {
        usuario_id,
        liga_id: id
      }
    });

    if (!usuarioLiga) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado en esta liga'
      });
    }

    await usuarioLiga.update({ activo: false });

    res.json({
      success: true,
      message: 'Usuario removido de la liga exitosamente'
    });
  } catch (error) {
    next(error);
  }
};
