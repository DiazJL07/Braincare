const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloud = require('../utils/cloudinary');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Foro = require('../models/Foro');

// Configuración de multer para subida de archivos
const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.join(__dirname, '..', 'public');
const storage = cloud.enabled ? multer.memoryStorage() : multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(PUBLIC_DIR, 'uploads', 'profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF)'));
    }
  }
});

const router = express.Router();

// Ruta pública para ver perfil de cualquier usuario
router.get('/public/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).render('error', {
        title: 'Usuario no encontrado',
        message: 'El usuario que buscas no existe.'
      });
    }

    // Obtener la URL de retorno si se proporciona
    const returnUrl = req.query.returnUrl || null;
    let psychProfile = null;
    if (user.role === 'psychologist') {
      const PsychologistProfile = require('../models/PsychologistProfile');
      psychProfile = await PsychologistProfile.findOne({ user: user._id }).populate('specialties').lean();
    }
    res.render('user/public-profile', { title: `Perfil de ${user.name}`, profileUser: user, psychProfile, returnUrl });
  } catch (error) {

    res.status(500).render('error', {
      title: 'Error del servidor',
      message: 'Hubo un problema al cargar el perfil.'
    });
  }
});

// Proteger las rutas privadas de usuario
router.use(protect);

// Perfil de usuario
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const PsychologistRequest = require('../models/PsychologistRequest');
    const latestRequest = await PsychologistRequest.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    let psychProfile = null;
    let specialties = [];
    if (user && user.role === 'psychologist') {
      const PsychologistProfile = require('../models/PsychologistProfile');
      const Specialty = require('../models/Specialty');
      psychProfile = await PsychologistProfile.findOne({ user: req.user._id }).populate('specialties').lean();
      if (!psychProfile) {
        psychProfile = await PsychologistProfile.create({ user: req.user._id });
        psychProfile = psychProfile.toObject();
      }
      specialties = await Specialty.find({ active: true }).sort({ name: 1 }).lean();
    }
    res.render('user/profile', { user, latestPsychRequest: latestRequest, psychProfile, specialties });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Actualizar perfil de usuario
router.post('/profile', async (req, res) => {
  try {
    const { name, email, currentPassword } = req.body;
    
    // Verificar contraseña actual
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).render('user/profile', {
        user: req.user,
        error: 'Usuario no encontrado'
      });
    }
    
    // Verificar si la contraseña actual es correcta
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).render('user/profile', {
        user: req.user,
        error: 'Contraseña actual incorrecta'
      });
    }
    
    // Actualizar usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true, runValidators: true }
    );
    
    // Actualizar referencias globalmente si el nombre cambió
    if (name !== req.user.name) {
      try {
        // Actualizar en colección Foro
        const Foro = require('../models/Foro');
        await Foro.updateMany(
          { author: req.user._id },
          { $set: { 'authorName': name } }
        );
        
        // Actualizar en colección Comment
        const Comment = require('../models/Comment');
        await Comment.updateMany(
          { author: req.user._id },
          { $set: { 'authorName': name } }
        );
        
        // Actualizar en colección Report
        const Report = require('../models/Report');
        await Report.updateMany(
          { reportedUser: req.user._id },
          { $set: { 'reportedUserName': name } }
        );
        
        await Report.updateMany(
          { reportedBy: req.user._id },
          { $set: { 'reportedByName': name } }
        );
        
        console.log(`Nombre de usuario actualizado globalmente: ${req.user.name} -> ${name}`);
      } catch (updateError) {
        console.error('Error al actualizar referencias globales:', updateError);
        // No fallar la actualización principal por esto
      }
    }
    
    res.render('user/profile', { 
      user: updatedUser,
      success: 'Perfil actualizado correctamente y referencias globales sincronizadas'
    });
  } catch (error) {
    res.status(400).render('user/profile', { 
      user: req.user,
      error: error.message 
    });
  }
});

router.post('/profile/psych', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'psychologist') {
      return res.status(403).render('error', { message: 'Acceso denegado' });
    }
    const PsychologistProfile = require('../models/PsychologistProfile');
    const { languages, experienceYears, specialties, topics, specialtiesText, bio } = req.body;
    const languagesArr = Array.isArray(languages) ? languages : (languages ? languages.split(',').map(s => s.trim()).filter(Boolean) : []);
    const topicsArr = Array.isArray(topics) ? topics : (topics ? topics.split(',').map(s => s.trim()).filter(Boolean) : []);
    const specialtyIds = Array.isArray(specialties) ? specialties.filter(Boolean) : (specialties ? [specialties] : []);
    const expYears = Number(experienceYears) || 0;
    let profile = await PsychologistProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = new PsychologistProfile({ user: req.user._id });
    }
    profile.languages = languagesArr;
    profile.experienceYears = expYears;
    // Crear especialidades desde texto si se proporcionan
    let specialtyIdsFromText = [];
    if (specialtiesText && specialtiesText.trim()) {
      const names = specialtiesText.split(',').map(s => s.trim()).filter(Boolean);
      const Specialty = require('../models/Specialty');
      for (const name of names) {
        let sp = await Specialty.findOne({ name });
        if (!sp) {
          try {
            sp = await Specialty.create({ name, active: true });
          } catch (e) {
            // ignorar errores de duplicado por condiciones de carrera
            sp = await Specialty.findOne({ name });
          }
        }
        if (sp) {
          specialtyIdsFromText.push(sp._id.toString());
        }
      }
    }
    profile.specialties = [...new Set([...specialtyIds, ...specialtyIdsFromText])];
    profile.topics = topicsArr;
    profile.bio = (bio || '').trim();
    await profile.save();
    const Specialty = require('../models/Specialty');
    const PsychologistRequest = require('../models/PsychologistRequest');
    const latestRequest = await PsychologistRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    const populatedProfile = await PsychologistProfile.findById(profile._id).populate('specialties').lean();
    res.render('user/profile', { user, latestPsychRequest: latestRequest, psychProfile: populatedProfile, specialties: await Specialty.find({ active: true }).sort({ name: 1 }).lean(), success: 'Perfil de psicólogo actualizado' });
  } catch (error) {
    res.status(500).render('user/profile', { user: req.user, error: error.message });
  }
});

// Verificar contraseña actual (endpoint AJAX)
router.post('/verify-current-password', async (req, res) => {
  try {
    const { currentPassword } = req.body;
    
    // Validar que se proporcione la contraseña
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña es requerida'
      });
    }
    
    // Obtener usuario con contraseña
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }
    
    // Verificar si la contraseña actual es correcta
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }
    
    // Contraseña correcta
    return res.json({
      success: true,
      message: 'Contraseña verificada correctamente'
    });
    
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Cambiar contraseña
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Función para manejar errores según el tipo de petición
    const handleError = (status, message) => {
      if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && 
          req.headers['x-requested-with'] !== 'XMLHttpRequest') {
        // Petición de formulario tradicional
        return res.status(status).render('user/profile', {
          user: req.user,
          error: message
        });
      } else {
        // Petición AJAX
        return res.status(status).json({
          success: false,
          error: message
        });
      }
    };
    
    // Función para manejar éxito según el tipo de petición
    const handleSuccess = (message, userData) => {
      if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && 
          req.headers['x-requested-with'] !== 'XMLHttpRequest') {
        // Petición de formulario tradicional
        return res.render('user/profile', { 
          user: userData,
          success: message
        });
      } else {
        // Petición AJAX
        return res.json({
          success: true,
          message: message
        });
      }
    };
    
    // Validaciones del lado del servidor
    
    // Verificar que todos los campos estén presentes
    if (!currentPassword || !newPassword || !confirmPassword) {
      return handleError(400, 'Todos los campos son requeridos');
    }
    
    // Verificar que la contraseña actual no esté vacía
    if (currentPassword.trim().length === 0) {
      return handleError(400, 'La contraseña actual es requerida');
    }
    
    // Verificar longitud mínima de la nueva contraseña
    if (newPassword.length < 8) {
      return handleError(400, 'La nueva contraseña debe tener al menos 8 caracteres');
    }
    
    // Verificar longitud máxima de la nueva contraseña
    if (newPassword.length > 50) {
      return handleError(400, 'La nueva contraseña no puede tener más de 50 caracteres');
    }
    
    // Verificar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return handleError(400, 'Las contraseñas no coinciden');
    }
    
    // Verificar que la nueva contraseña sea diferente a la actual
    if (newPassword === currentPassword) {
      return handleError(400, 'La nueva contraseña debe ser diferente a la actual');
    }
    
    // Validar fortaleza de la contraseña
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    let strengthScore = 0;
    if (hasUpperCase) strengthScore++;
    if (hasLowerCase) strengthScore++;
    if (hasNumbers) strengthScore++;
    if (hasSpecialChar) strengthScore++;
    
    if (strengthScore < 2) {
      return handleError(400, 'La contraseña debe contener al menos 2 de: mayúsculas, minúsculas, números o símbolos');
    }
    
    // Obtener usuario con contraseña
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return handleError(404, 'Usuario no encontrado');
    }
    
    // Verificar si la contraseña actual es correcta
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return handleError(401, 'Contraseña actual incorrecta');
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    // Respuesta de éxito
    return handleSuccess('Contraseña actualizada correctamente', user);
    
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded' && 
        req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      return res.status(500).render('user/profile', { 
        user: req.user,
        error: 'Error interno del servidor. Inténtalo de nuevo.' 
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor. Inténtalo de nuevo.'
      });
    }
  }
});

// Redirección para evitar error 'Cannot GET /user/profile/image'
router.get('/profile/image', (req, res) => {
  res.redirect('/user/profile');
});

// Subir imagen de perfil
const uploadProfileSafe = (req, res, next) => {
  upload.single('profileImage')(req, res, function(err) {
    if (err) {
      return res.status(400).render('user/profile', {
        user: req.user,
        uploadError: err.message
      });
    }
    next();
  });
};

router.post('/profile/image', uploadProfileSafe, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'No se seleccionó ninguna imagen'
      });
    }

    let updatedUser;
    if (cloud.enabled) {
      const up = await cloud.uploadImage(req.file.buffer, { folder: 'users/profile' });
      // Borrar imagen anterior en Cloudinary
      const oldId = req.user.profileImagePublicId || cloud.extractPublicIdFromUrl(req.user.profileImage);
      if (oldId) await cloud.deleteResource(oldId, 'image');
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: cloud.buildImageUrl(up.public_id), profileImagePublicId: up.public_id },
        { new: true }
      );
    } else {
      const imagePath = '/uploads/profiles/' + req.file.filename;
      // Eliminar imagen anterior local
      if (req.user.profileImage && req.user.profileImage !== '/img/default-avatar.svg') {
        const oldImagePath = path.join(PUBLIC_DIR, req.user.profileImage.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: imagePath, profileImagePublicId: null },
        { new: true }
      );
    }

    res.render('user/profile', {
      user: updatedUser,
      success: 'Imagen de perfil actualizada correctamente'
    });
  } catch (error) {
    res.status(400).render('user/profile', {
      user: req.user,
      error: error.message
    });
  }
});

// Redirección para evitar error 'Cannot GET /user/profile/cover'
router.get('/profile/cover', (req, res) => {
  res.redirect('/user/profile');
});

// Subir imagen de portada
const uploadCoverSafe = (req, res, next) => {
  upload.single('coverImage')(req, res, function(err) {
    if (err) {
      return res.status(400).render('user/profile', {
        user: req.user,
        uploadError: err.message
      });
    }
    next();
  });
};

router.post('/profile/cover', uploadCoverSafe, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'No se seleccionó ninguna imagen'
      });
    }

    let updatedUser;
    if (cloud.enabled) {
      const up = await cloud.uploadImage(req.file.buffer, { folder: 'users/cover' });
      const oldId = req.user.coverImagePublicId || cloud.extractPublicIdFromUrl(req.user.coverImage);
      if (oldId) await cloud.deleteResource(oldId, 'image');
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { coverImage: cloud.buildImageUrl(up.public_id), coverImagePublicId: up.public_id },
        { new: true }
      );
    } else {
      const imagePath = '/uploads/profiles/' + req.file.filename;
      if (req.user.coverImage && req.user.coverImage !== '/img/default-cover.svg') {
        const oldImagePath = path.join(PUBLIC_DIR, req.user.coverImage.replace(/^\//, ''));
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { coverImage: imagePath, coverImagePublicId: null },
        { new: true }
      );
    }

    res.render('user/profile', {
      user: updatedUser,
      success: 'Imagen de portada actualizada correctamente'
    });
  } catch (error) {
    res.status(400).render('user/profile', {
      user: req.user,
      error: error.message
    });
  }
});

// Cambiar rol (solo para administradores)
router.post('/profile/role', async (req, res) => {
  try {
    const { role, currentPassword } = req.body;
    
    // Verificar que el usuario actual sea administrador
    if (req.user.role !== 'admin') {
      return res.status(403).render('user/profile', {
        user: req.user,
        error: 'No tienes permisos para cambiar roles'
      });
    }
    
    // Verificar contraseña actual
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).render('user/profile', {
        user: req.user,
        error: 'Usuario no encontrado'
      });
    }
    
    // Verificar si la contraseña actual es correcta
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).render('user/profile', {
        user: req.user,
        error: 'Contraseña actual incorrecta'
      });
    }
    
    // Actualizar rol
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    );
    
    res.render('user/profile', { 
      user: updatedUser,
      success: 'Rol actualizado correctamente'
    });
  } catch (error) {
    res.status(400).render('user/profile', { 
      user: req.user,
      error: error.message 
    });
  }
});

// API endpoint para obtener el número de foros creados por un usuario
router.get('/:userId/forums-count', async (req, res) => {
  try {
    const userId = req.params.userId;
    const forumCount = await Foro.countDocuments({ author: userId });
    res.json({ count: forumCount });
  } catch (error) {

    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// API para obtener notificaciones del usuario
router.get('/notifications', protect, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
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
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída
router.post('/notifications/mark-read', protect, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
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

// Marcar todas las notificaciones como leídas
router.post('/notifications/mark-all-read', protect, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    
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

// Subida de evidencia para solicitud de psicólogo
const proofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/psychologist-requests');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (JPEG, JPG, PNG, GIF)'));
    }
  }
});

// Solicitud de rol psicólogo
router.post('/psychologist-request', proofUpload.single('proofImage'), async (req, res) => {
  try {
    const PsychologistRequest = require('../models/PsychologistRequest');
    const Notification = require('../models/Notification');

    if (req.user.role === 'psychologist') {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'Ya tienes rol de psicólogo'
      });
    }

    const { fullName, email, servicesDescription } = req.body;

    if (!req.file) {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'Debes adjuntar una imagen como evidencia'
      });
    }

    // Verificar si existe solicitud pendiente y si se permite nueva
    const lastRequest = await PsychologistRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (lastRequest && lastRequest.status === 'pending') {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'Ya tienes una solicitud en revisión'
      });
    }
    if (lastRequest && lastRequest.status === 'rejected' && lastRequest.reapplyAllowed === false) {
      return res.status(400).render('user/profile', {
        user: req.user,
        error: 'No se permite enviar nuevas solicitudes'
      });
    }

    const proofPath = '/uploads/psychologist-requests/' + req.file.filename;
    const created = await PsychologistRequest.create({
      user: req.user._id,
      fullName,
      email,
      servicesDescription,
      proofImage: proofPath
    });

    // Notificación de recepción (opcional general)
    try {
      await Notification.create({
        recipient: req.user._id,
        type: 'new_report',
        title: 'Solicitud recibida',
        message: 'Tu solicitud para rol psicólogo ha sido recibida y será evaluada.'
      });
      // Notificar a administradores sobre nueva solicitud
      const admins = await User.find({ role: 'admin' }).select('_id');
      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          type: 'new_report',
          title: 'Nueva solicitud de psicólogo',
          message: `${req.user.name} envió una nueva solicitud para rol psicólogo.`
        });
      }
    } catch (e) {}

    const userFresh = await User.findById(req.user._id);
    const latestRequest = await PsychologistRequest.findById(created._id).lean();
    return res.render('user/profile', {
      user: userFresh,
      latestPsychRequest: latestRequest,
      success: 'Gracias por tu solicitud. Será evaluada para aprobación.'
    });
  } catch (error) {
    console.error('Error al enviar solicitud de psicólogo:', error);
    return res.status(500).render('user/profile', {
      user: req.user,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
