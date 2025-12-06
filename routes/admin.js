const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Report = require('../models/Report');
const Foro = require('../models/Foro');
const Comment = require('../models/Comment');
const Topic = require('../models/Topic');
const Notification = require('../models/Notification');
const PsychologistRequest = require('../models/PsychologistRequest');

const router = express.Router();

// API para obtener notificaciones del usuario (accesible para todos los usuarios autenticados)
router.get('/api/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('relatedReport');
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      read: false 
    });
    
    res.json({ 
      success: true, 
      notifications, 
      unreadCount 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída (accesible para todos los usuarios autenticados)
router.post('/api/notifications/mark-read', protect, async (req, res) => {
  try {
    const { notificationId } = req.body;
    
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Marcar todas las notificaciones como leídas (accesible para todos los usuarios autenticados)
router.post('/api/notifications/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Proteger todas las rutas de administrador
router.use(protect, admin, (req, res, next) => {
  // Establecer encabezados para prevenir el almacenamiento en caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Panel de administrador
router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.find({});
    res.render('admin/dashboard', { users });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Solicitudes de rol psicólogo
router.get('/requests', async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const filter = status === 'all' ? {} : { status };
    const requests = await PsychologistRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email role profileImage');
    res.render('admin/psych-requests-dashboard', { requests, currentStatus: status });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

router.get('/requests/:id', async (req, res) => {
  try {
    const request = await PsychologistRequest.findById(req.params.id)
      .populate('user', 'name email role profileImage');
    if (!request) {
      return res.status(404).render('error', { message: 'Solicitud no encontrada' });
    }
    res.render('admin/psych-request-detail', { request });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

router.post('/requests/:id/process', async (req, res) => {
  try {
    const { action, rejectionReason, reapplyAllowed } = req.body;
    const request = await PsychologistRequest.findById(req.params.id).populate('user');
    if (!request) {
      req.flash('error_msg', 'Solicitud no encontrada');
      return res.redirect('/admin/requests');
    }

    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    if (action === 'approve') {
      request.status = 'approved';
      await request.save();
      await User.findByIdAndUpdate(request.user._id, { role: 'psychologist' });
      await Notification.create({
        recipient: request.user._id,
        type: 'psychologist_request_approved',
        title: 'Solicitud aprobada',
        message: 'Tu solicitud para rol psicólogo ha sido aprobada. Ya tienes acceso a tus funciones.'
      });
      req.flash('success_msg', 'Solicitud aprobada y rol actualizado');
      return res.redirect('/admin/requests');
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.rejectionReason = rejectionReason || 'Solicitud rechazada';
      request.reapplyAllowed = reapplyAllowed === 'true' || reapplyAllowed === true;
      await request.save();
      await Notification.create({
        recipient: request.user._id,
        type: 'psychologist_request_rejected',
        title: 'Solicitud rechazada',
        message: `Tu solicitud fue rechazada. Motivo: ${request.rejectionReason}. ${request.reapplyAllowed ? 'Puedes volver a solicitar.' : 'No se permiten nuevas solicitudes.'}`
      });
      req.flash('success_msg', 'Solicitud rechazada');
      return res.redirect('/admin/requests');
    }

    req.flash('error_msg', 'Acción inválida');
    return res.redirect('/admin/requests');
  } catch (error) {
    console.error('Error al procesar solicitud de psicólogo:', error);
    req.flash('error_msg', 'Error interno del servidor');
    res.redirect('/admin/requests');
  }
});

// Formulario para crear usuario
router.get('/users/new', (req, res) => {
  res.render('admin/user-form', { targetUser: {} });
});

// Ver usuario específico
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).render('error', { message: 'Usuario no encontrado' });
    }
    
    // Preservar el administrador logueado en res.locals.user
    const adminUser = res.locals.user;
    
    // Obtener estadísticas reales del usuario
    const Foro = require('../models/Foro');
    const Comment = require('../models/Comment');
    const Report = require('../models/Report');
    
    // Contar publicaciones del usuario
    const publicacionesCount = await Foro.countDocuments({ author: user._id });
    
    // Contar comentarios del usuario
    const comentariosCount = await Comment.countDocuments({ author: user._id });
    
    // Contar reportes recibidos por el usuario
    const reportesCount = await Report.countDocuments({ reportedUser: user._id });
    
    // Obtener actividad reciente del usuario
    const recentActivity = [];
    
    // Últimas publicaciones
    const recentPosts = await Foro.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt');
    
    recentPosts.forEach(post => {
      recentActivity.push({
        type: 'post',
        title: `Creó la publicación "${post.title}"`,
        date: post.createdAt,
        icon: 'fas fa-plus-circle',
        color: 'success'
      });
    });
    
    // Últimos comentarios
    const recentComments = await Comment.find({ author: user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('post', 'title')
      .select('content createdAt post');
    
    recentComments.forEach(comment => {
      recentActivity.push({
        type: 'comment',
        title: `Comentó en "${comment.post ? comment.post.title : 'Publicación eliminada'}"`,
        date: comment.createdAt,
        icon: 'fas fa-comment',
        color: 'info'
      });
    });
    
    // Ordenar actividad por fecha
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const userStats = {
      publicaciones: publicacionesCount,
      comentarios: comentariosCount,
      reportes: reportesCount,
      perfilActivo: user.isBanned ? 0 : 1
    };
    
    // Asegurar que res.locals.user mantenga el administrador logueado
    res.locals.user = adminUser;
    
    res.render('admin/user-detail', { 
      targetUser: user, 
      userStats,
      recentActivity: recentActivity.slice(0, 10)
    });
  } catch (error) {
    console.error('Error al cargar detalles del usuario:', error);
    res.status(500).render('error', { message: error.message });
  }
});

// Crear usuario
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Crear usuario
    await User.create({
      name,
      email,
      password,
      role
    });
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/user-form', { 
      targetUser: req.body,
      error: error.message 
    });
  }
});

// Formulario para editar usuario
router.get('/users/:id/edit', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).render('error', { message: 'Usuario no encontrado' });
    }
    const adminUser = res.locals.user;
    res.locals.user = adminUser;
    res.render('admin/user-form', { targetUser: user });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Actualizar usuario
router.post('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Obtener el usuario actual para verificar si el nombre cambió
    const currentUser = await User.findById(req.params.id);
    
    // Actualizar usuario
    await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { runValidators: true }
    );
    try {
      const Foro = require('../models/Foro');
      const Comment = require('../models/Comment');
      const idObj = currentUser._id;
      const candidateNames = [currentUser.name, name].filter(Boolean);
      if (candidateNames.length) {
        await Foro.updateMany({ author: { $in: candidateNames } }, { $set: { author: idObj } });
        await Comment.updateMany({ author: { $in: candidateNames } }, { $set: { author: idObj } });
      }
    } catch (_) {}
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/user-form', { 
      targetUser: { ...req.body, _id: req.params.id },
      error: error.message 
    });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const currentUser = await User.findById(req.params.id);
    await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { runValidators: true }
    );
    try {
      const Foro = require('../models/Foro');
      const Comment = require('../models/Comment');
      const idObj = currentUser._id;
      const candidateNames = [currentUser.name, name].filter(Boolean);
      if (candidateNames.length) {
        await Foro.updateMany({ author: { $in: candidateNames } }, { $set: { author: idObj } });
        await Comment.updateMany({ author: { $in: candidateNames } }, { $set: { author: idObj } });
      }
    } catch (_) {}
    res.redirect('/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/user-form', { 
      targetUser: { ...req.body, _id: req.params.id },
      error: error.message 
    });
  }
});

// Eliminar usuario
router.post('/users/:id/delete', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'Usuario eliminado exitosamente');
    res.redirect('/admin/dashboard');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/admin/dashboard');
  }
});

// Rutas para gestión de reportes
router.get('/reports', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';

    let filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate('reporter', 'name email profileImage')
      .populate('reportedUser', 'name email reportsReceived isBanned')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Poblar el contenido reportado basado en contentType
    for (let report of reports) {
      if (report.contentType === 'foro') {
        const foro = await Foro.findById(report.contentId).populate('author', 'name');
        report.reportedContent = foro;
      } else if (report.contentType === 'comment') {
        const comment = await Comment.findById(report.contentId).populate('author', 'name');
        report.reportedContent = comment;
      }
    }

    const totalReports = await Report.countDocuments(filter);
    const totalPages = Math.ceil(totalReports / limit);

    // Estadísticas
    const pendingCount = await Report.countDocuments({ status: 'pending' });
    const totalCount = await Report.countDocuments();

    res.render('admin/reports-dashboard', {
      reports,
      currentPage: page,
      totalPages,
      currentStatus: status,
      pendingCount,
      total: totalCount
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// API endpoint para obtener conteo de reportes pendientes (para notificaciones)
router.get('/api/reports/pending-count', async (req, res) => {
  try {
    const count = await Report.countDocuments({ status: 'pending' });
    const reports = await Report.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('contentType reason createdAt')
      .lean();
    
    res.json({ count, reports });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email profileImage')
      .populate('reportedUser', 'name email reportsReceived isBanned')
      .populate('reviewedBy', 'name');

    if (!report) {
      return res.status(404).render('error', { message: 'Reporte no encontrado' });
    }

    // Obtener el contenido reportado
    let reportedContent = null;
    let relatedForo = null;
    if (report.contentType === 'foro') {
      reportedContent = await Foro.findById(report.contentId).populate('author', 'name');
    } else if (report.contentType === 'comment') {
      reportedContent = await Comment.findById(report.contentId)
        .populate('author', 'name')
        .populate('post', 'title content author topic publicationDate');
      
      // Si el comentario existe, obtener información adicional del foro
      if (reportedContent && reportedContent.post) {
        relatedForo = await Foro.findById(reportedContent.post._id)
          .populate('author', 'name')
          .populate('topic', 'name');
      }
    }

    res.render('admin/report-detail', { 
      report, 
      reportedContent,
      relatedForo 
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Banear usuario
router.post('/users/:id/ban', async (req, res) => {
  try {
    const { banType, banDuration, banReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.isBanned = true;
    user.banReason = banReason || 'Violación de las normas de la comunidad';
    user.banDate = new Date();
    user.bannedBy = req.user._id;

    if (banType === 'temporary' && banDuration) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(banDuration));
      user.banExpiresAt = expirationDate;
    }

    await user.save();

    res.json({ success: true, message: 'Usuario baneado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Desbanear usuario
router.post('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    user.isBanned = false;
    user.banReason = undefined;
    user.banDate = undefined;
    user.banExpiresAt = undefined;
    user.bannedBy = undefined;

    await user.save();

    res.json({ success: true, message: 'Usuario desbaneado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Procesar reporte (aprobar/rechazar)
router.post('/reports/:id/process', async (req, res) => {
  try {
    const { action, adminNotes, sanction, banDuration, warningMessage } = req.body;
    const report = await Report.findById(req.params.id).populate('reportedUser reporter');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    report.status = action === 'approved' ? 'resolved' : 'dismissed';
    report.adminAction = sanction || 'none';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    if (adminNotes) {
      report.adminNotes = adminNotes;
    }

    await report.save();

    let notificationTitle, notificationMessage, actionTaken = 'none';
    let banDays = null;

    if (action === 'approved' && report.reportedUser) {
      // Aplicar sanciones según la decisión del admin
      if (sanction === 'warning') {
        actionTaken = 'warning';
        notificationTitle = '⚠️ Advertencia Recibida';
        notificationMessage = warningMessage || `Has recibido una advertencia por: ${report.reason}. ${adminNotes ? 'Notas del administrador: ' + adminNotes : ''}`;
        
        // Incrementar contador de advertencias
        await User.findByIdAndUpdate(report.reportedUser._id, {
          $inc: { warningsReceived: 1 }
        });
      } else if (sanction === 'temporary_ban') {
        actionTaken = 'temp_ban';
        banDays = parseInt(banDuration) || 7;
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + banDays);
        
        await User.findByIdAndUpdate(report.reportedUser._id, {
          isBanned: true,
          banReason: `Reporte aprobado: ${report.reason}`,
          banDate: new Date(),
          banExpiresAt: banUntil,
          bannedBy: req.user._id
        });
        
        notificationTitle = '🚫 Cuenta Suspendida Temporalmente';
        notificationMessage = `Tu cuenta ha sido suspendida por ${banDays} días debido a: ${report.reason}. Podrás acceder nuevamente el ${banUntil.toLocaleDateString('es-ES')}. ${adminNotes ? 'Notas del administrador: ' + adminNotes : ''}`;
      } else if (sanction === 'permanent_ban') {
        actionTaken = 'permanent_ban';
        
        await User.findByIdAndUpdate(report.reportedUser._id, {
          isBanned: true,
          banReason: `Reporte aprobado: ${report.reason}`,
          banDate: new Date(),
          banExpiresAt: null,
          bannedBy: req.user._id
        });
        
        notificationTitle = '🚫 Cuenta Suspendida Permanentemente';
        notificationMessage = `Tu cuenta ha sido suspendida permanentemente debido a: ${report.reason}. ${adminNotes ? 'Notas del administrador: ' + adminNotes : ''}`;
      } else {
        notificationTitle = '📋 Reporte Procesado';
        notificationMessage = `Se ha procesado un reporte en tu contra. Motivo: ${report.reason}. ${adminNotes ? 'Notas del administrador: ' + adminNotes : ''}`;
      }

      // Crear notificación para el usuario reportado
      await Notification.create({
        recipient: report.reportedUser._id,
        type: actionTaken === 'warning' ? 'warning' : (actionTaken === 'permanent_ban' ? 'ban' : (actionTaken === 'temp_ban' ? 'ban' : 'report_resolved')),
        title: notificationTitle,
        message: notificationMessage,
        relatedReport: report._id,
        actionTaken: actionTaken,
        banDuration: banDays
      });

      // Incrementar contador de reportes del usuario reportado
      await User.findByIdAndUpdate(report.reportedUser._id, {
        $inc: { reportsReceived: 1 }
      });
    } else if (action === 'rejected') {
      // Notificar al usuario que reportó que su reporte fue rechazado
      notificationTitle = '📋 Reporte Rechazado';
      notificationMessage = `Tu reporte ha sido revisado y rechazado. ${adminNotes ? 'Motivo: ' + adminNotes : ''}`;
      
      await Notification.create({
        recipient: report.reporter._id,
        type: 'report_resolved',
        title: notificationTitle,
        message: notificationMessage,
        relatedReport: report._id,
        actionTaken: 'none'
      });
    }

    res.json({ success: true, message: `Reporte ${action === 'approved' ? 'aprobado' : 'rechazado'} exitosamente` });
  } catch (error) {
    console.error('Error procesando reporte:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});



// Eliminar foro
router.delete('/foros/:id', async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id);
    
    if (!foro) {
      return res.status(404).json({ success: false, message: 'Foro no encontrado' });
    }

    // Eliminar el foro
    await Foro.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Foro eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// ===== RUTAS PARA GESTIÓN DE TEMAS =====

// API para obtener temas (para el modal)
router.get('/topics/api', async (req, res) => {
  try {
    const topics = await Topic.find().sort({ name: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Listar todos los temas
router.get('/topics', async (req, res) => {
  try {
    const topics = await Topic.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.render('admin/topics-dashboard', {
      title: 'Gestión de Temas',
      topics,
      user: req.user
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

// Mostrar formulario para crear nuevo tema
router.get('/topics/new', (req, res) => {
  res.render('admin/topic-form', {
    title: 'Crear Nuevo Tema',
    topic: null,
    user: req.user
  });
});

// Crear nuevo tema
router.post('/topics', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    // Verificar si el tema ya existe
    const existingTopic = await Topic.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingTopic) {
      return res.status(400).json({ success: false, message: 'Ya existe un tema con ese nombre' });
    }
    
    const topic = new Topic({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    await topic.save();
    
    res.json({ success: true, message: 'Tema creado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Mostrar formulario para editar tema
router.get('/topics/:id/edit', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) {
      return res.status(404).render('error', { message: 'Tema no encontrado' });
    }
    
    res.render('admin/topic-form', {
      title: 'Editar Tema',
      topic,
      user: req.user
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

// Actualizar tema
router.post('/topics/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    // Verificar si el tema ya existe (excluyendo el actual)
    const existingTopic = await Topic.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    if (existingTopic) {
      return res.status(400).json({ success: false, message: 'Ya existe un tema con ese nombre' });
    }
    
    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive: !!isActive },
      { new: true }
    );
    
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Tema no encontrado' });
    }
    
    res.json({ success: true, message: 'Tema actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Eliminar tema
router.delete('/topics/:id', async (req, res) => {
  try {
    // Verificar si hay foros usando este tema y eliminarlos también
    const forosCount = await Foro.countDocuments({ topic: req.params.id });
    
    if (forosCount > 0) {
      // Eliminar todos los foros asociados al tema
      await Foro.deleteMany({ topic: req.params.id });
    }
    
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Tema no encontrado' });
    }
    
    const message = forosCount > 0 
      ? `Tema eliminado exitosamente junto con ${forosCount} publicación(es) asociada(s)`
      : 'Tema eliminado exitosamente';
    
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// API para obtener temas activos (para formularios)
router.get('/api/topics/active', async (req, res) => {
  try {
    const topics = await Topic.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, topics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// API para obtener estadísticas de usuario en tiempo real
router.get('/users/:id/api/stats', async (req, res) => {
  try {
    const userId = req.params.id;
    const Foro = require('../models/Foro');
    const Comment = require('../models/Comment');
    const Report = require('../models/Report');
    
    // Obtener estadísticas actualizadas
    const publicacionesCount = await Foro.countDocuments({ author: userId });
    const comentariosCount = await Comment.countDocuments({ author: userId });
    const reportesCount = await Report.countDocuments({ reportedUser: userId });
    const user = await User.findById(userId);
    
    const userStats = {
      publicaciones: publicacionesCount,
      comentarios: comentariosCount,
      reportes: reportesCount,
      perfilActivo: user && !user.isBanned ? 1 : 0
    };
    
    res.json({ success: true, stats: userStats });
  } catch (error) {
    console.error('Error al obtener estadísticas de usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// API para obtener actividad reciente del usuario en tiempo real
router.get('/users/:id/api/activity', async (req, res) => {
  try {
    const userId = req.params.id;
    const Foro = require('../models/Foro');
    const Comment = require('../models/Comment');
    const Report = require('../models/Report');
    
    const recentActivity = [];
    
    // Últimas publicaciones (últimas 10)
    const recentPosts = await Foro.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title createdAt');
    
    recentPosts.forEach(post => {
      recentActivity.push({
        type: 'post',
        title: `Creó la publicación "${post.title}"`,
        date: post.createdAt,
        icon: 'fas fa-plus-circle',
        color: 'success'
      });
    });
    
    // Últimos comentarios (últimos 10)
    const recentComments = await Comment.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('post', 'title')
      .select('content createdAt post');
    
    recentComments.forEach(comment => {
      recentActivity.push({
        type: 'comment',
        title: `Comentó en "${comment.post ? comment.post.title : 'Publicación eliminada'}"`,
        date: comment.createdAt,
        icon: 'fas fa-comment',
        color: 'info'
      });
    });
    
    // Reportes recientes (últimos 5)
    const recentReports = await Report.find({ reportedUser: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('reason createdAt status');
    
    recentReports.forEach(report => {
      recentActivity.push({
        type: 'report',
        title: `Recibió un reporte por "${report.reason}"`,
        date: report.createdAt,
        icon: 'fas fa-exclamation-triangle',
        color: 'warning'
      });
    });
    
    // Ordenar actividad por fecha (más reciente primero)
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({ 
      success: true, 
      activity: recentActivity.slice(0, 15) // Mostrar solo las 15 más recientes
    });
  } catch (error) {
    console.error('Error al obtener actividad del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener actividad' });
  }
});

module.exports = router;
