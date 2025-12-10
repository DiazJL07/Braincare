const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const Report = require('../models/Report');
const User = require('../models/User');
const Foro = require('../models/Foro');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

const router = express.Router();

// Normalización de motivos del reporte
function normalizeReason(reason) {
  const map = {
    'spam': 'Spam',
    'harassment': 'Acoso o bullying',
    'hate_speech': 'Lenguaje ofensivo',
    'inappropriate_content': 'Contenido inapropiado',
    'misinformation': 'Información falsa',
    'violence': 'Violación de términos',
    'copyright': 'Violación de términos',
    'other': 'Otro'
  };
  if (!reason) return reason;
  const trimmed = String(reason).trim();
  return map[trimmed] || trimmed;
}

// Reportar un foro
router.post('/foro/:id', protect, async (req, res) => {
  try {
    let { reason, description } = req.body;
    reason = normalizeReason(reason);
    const foroId = req.params.id;
    
    // Verificar que el foro existe
    const foro = await Foro.findById(foroId).populate('author');
    if (!foro) {
      return res.status(404).json({ success: false, message: 'Foro no encontrado' });
    }
    if (!foro.author) {
      return res.status(400).json({ success: false, message: 'No es posible reportar: la publicación no tiene autor' });
    }
    
    // No permitir auto-reportes
    if (foro.author._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'No puedes reportar tu propio contenido' });
    }
    
    // Verificar si ya existe un reporte del mismo usuario para este contenido
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      contentType: 'foro',
      contentId: foroId
    });
    
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'Ya has reportado este contenido' });
    }
    
    // Validar razón
    const allowedReasons = ['Contenido inapropiado','Spam','Acoso o bullying','Lenguaje ofensivo','Información falsa','Violación de términos','Otro'];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Razón de reporte inválida' });
    }
    // Crear el reporte
    const report = new Report({
      reporter: req.user._id,
      reportedUser: foro.author._id,
      contentType: 'foro',
      contentId: foroId,
      reason,
      description
    });
    
    await report.save();
    
    // Incrementar contador de reportes del usuario reportado
    await User.findByIdAndUpdate(foro.author._id, {
      $inc: { reportsReceived: 1 }
    });
    
    // Notificar a todos los administradores sobre el nuevo reporte
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => ({
      recipient: admin._id,
      type: 'new_report',
      title: '🚨 Nuevo Reporte Recibido',
      message: `Se ha recibido un nuevo reporte de foro por "${reason}". Usuario reportado: ${foro.author.name}`,
      relatedReport: report._id,
      actionTaken: 'none'
    }));
    
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }
    
    res.json({ success: true, message: 'Reporte enviado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Reportar un comentario
router.post('/comment/:id', protect, async (req, res) => {
  try {
    let { reason, description } = req.body;
    reason = normalizeReason(reason);
    const commentId = req.params.id;
    
    // Verificar que el comentario existe
    const comment = await Comment.findById(commentId).populate('author');
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
    }
    if (!comment.author) {
      return res.status(400).json({ success: false, message: 'No es posible reportar: el comentario no tiene autor' });
    }
    
    // No permitir auto-reportes
    if (comment.author._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'No puedes reportar tu propio contenido' });
    }
    
    // Verificar si ya existe un reporte del mismo usuario para este contenido
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      contentType: 'comment',
      contentId: commentId
    });
    
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'Ya has reportado este contenido' });
    }
    
    // Validar razón
    const allowedReasons = ['Contenido inapropiado','Spam','Acoso o bullying','Lenguaje ofensivo','Información falsa','Violación de términos','Otro'];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Razón de reporte inválida' });
    }
    // Crear el reporte
    const report = new Report({
      reporter: req.user._id,
      reportedUser: comment.author._id,
      contentType: 'comment',
      contentId: commentId,
      reason,
      description
    });
    
    await report.save();
    
    // Incrementar contador de reportes del usuario reportado
    await User.findByIdAndUpdate(comment.author._id, {
      $inc: { reportsReceived: 1 }
    });
    
    // Notificar a todos los administradores sobre el nuevo reporte
    const admins = await User.find({ role: 'admin' });
    const adminNotifications = admins.map(admin => ({
      recipient: admin._id,
      type: 'new_report',
      title: '🚨 Nuevo Reporte Recibido',
      message: `Se ha recibido un nuevo reporte de comentario por "${reason}". Usuario reportado: ${comment.author.name}`,
      relatedReport: report._id,
      actionTaken: 'none'
    }));
    
    if (adminNotifications.length > 0) {
      await Notification.insertMany(adminNotifications);
    }
    
    res.json({ success: true, message: 'Reporte enviado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Ruta general para crear reportes (desde report-content.ejs)
router.post('/create', protect, async (req, res) => {
  try {
    let { contentType, contentId, reportedUserId, reason, description } = req.body;
    reason = normalizeReason(reason);
    
    // Validar datos requeridos
    if (!contentType || !contentId || !reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }
    
    // No permitir auto-reportes
    if (reportedUserId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'No puedes reportar tu propio contenido' });
    }
    
    // Verificar si ya existe un reporte del mismo usuario para este contenido
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      contentType: contentType,
      contentId: contentId
    });
    
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'Ya has reportado este contenido' });
    }
    
    // Validar razón
    const allowedReasons = ['Contenido inapropiado','Spam','Acoso o bullying','Lenguaje ofensivo','Información falsa','Violación de términos','Otro'];
    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Razón de reporte inválida' });
    }
    // Crear el reporte
    const report = new Report({
      reporter: req.user._id,
      reportedUser: reportedUserId,
      contentType: contentType,
      contentId: contentId,
      reason,
      description
    });
    
    await report.save();
    
    // Incrementar contador de reportes del usuario reportado
    await User.findByIdAndUpdate(reportedUserId, {
      $inc: { reportsReceived: 1 }
    });
    
    // Notificar a todos los administradores sobre el nuevo reporte
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const reportedUser = await User.findById(reportedUserId);
      const adminNotifications = admins.map(admin => ({
        recipient: admin._id,
        type: 'new_report',
        title: '🚨 Nuevo Reporte Recibido',
        message: `Se ha recibido un nuevo reporte de ${contentType} por "${reason}". Usuario reportado: ${reportedUser ? reportedUser.name : 'Usuario desconocido'}`,
        relatedReport: report._id,
        actionTaken: 'none'
      }));
      
      await Notification.insertMany(adminNotifications);
    }
    
    res.json({ success: true, message: 'Reporte enviado correctamente' });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// API endpoint para obtener conteo de reportes pendientes (para notificaciones)
router.get('/pending-count', protect, admin, async (req, res) => {
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

// Procesar un reporte (marcar como revisado, tomar acción)
router.post('/:id/process', protect, admin, async (req, res) => {
  try {
    const { action, sanction, adminNotes, banDuration } = req.body;
    const reportId = req.params.id;

    const report = await Report.findById(reportId).populate('reportedUser');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    // Actualizar el reporte según decisión
    if (action === 'approved') {
      report.status = 'resolved';
    } else if (action === 'rejected') {
      report.status = 'dismissed';
    } else {
      report.status = 'reviewed';
    }

    // Aplicar sanción seleccionada
    const appliedSanction = sanction || 'none';
    report.adminAction = appliedSanction;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.adminNotes = adminNotes;

    await report.save();

    // Tomar acción según la sanción
    if (appliedSanction === 'temporary_ban' || appliedSanction === 'permanent_ban') {
      const banData = {
        isBanned: true,
        banReason: `Reporte procesado: ${report.reason}`,
        banDate: new Date(),
        bannedBy: req.user._id
      };

      if (appliedSanction === 'temporary_ban' && banDuration) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + parseInt(banDuration));
        banData.banExpiresAt = expirationDate;
      }

      await User.findByIdAndUpdate(report.reportedUser._id, banData);
    }

    res.json({ success: true, message: 'Reporte procesado correctamente' });
  } catch (error) {

    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Ver detalles de un reporte específico
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email reportsReceived isBanned')
      .populate('reviewedBy', 'name');

    if (!report) {
      return res.status(404).render('error', { message: 'Reporte no encontrado' });
    }

    // Obtener el contenido reportado
    let reportedContent = null;
    if (report.contentType === 'foro') {
      reportedContent = await Foro.findById(report.contentId).populate('author', 'name');
    } else if (report.contentType === 'comment') {
      reportedContent = await Comment.findById(report.contentId).populate('author', 'name');
    }
    // Aquí se pueden agregar más tipos de contenido en el futuro

    res.render('admin/report-detail', { 
      report, 
      reportedContent 
    });
  } catch (error) {

    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;