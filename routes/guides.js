const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloud = require('../utils/cloudinary');
const https = require('https');
const { protect, admin, adminOrPsychologist } = require('../middleware/authMiddleware');
const Guide = require('../models/Guide');
const User = require('../models/User');

const router = express.Router();

const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.join(__dirname, '..', 'public');

// Configuración de multer para subir imágenes y PDFs
const storage = cloud.enabled ? multer.memoryStorage() : multer.diskStorage({
  destination: function (req, file, cb) {
    // Determinar la carpeta de destino según el tipo de archivo
    const destFolder = file.fieldname === 'image' ? path.join(PUBLIC_DIR, 'img', 'guides') : path.join(PUBLIC_DIR, 'pdf', 'guides');
    
    // Crear la carpeta si no existe
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    
    cb(null, destFolder);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'image' ? 'guide-img-' : 'guide-pdf-';
    const origExt = path.extname(file.originalname).toLowerCase();
    const ext = file.fieldname === 'pdfFile' ? '.pdf' : (origExt || '.png');
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'));
      }
    } else if (file.fieldname === 'pdfFile') {
      const pdfMimes = ['application/pdf', 'application/x-pdf', 'application/acrobat', 'applications/pdf', 'application/vnd.pdf'];
      const hasPdfMime = pdfMimes.includes(String(file.mimetype).toLowerCase());
      const hasPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
      if (hasPdfMime || hasPdfExt) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF'));
      }
    } else {
      cb(new Error('Tipo de archivo no soportado'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const uploadGuideFieldsSafe = (req, res, next) => {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ])(req, res, function(err) {
    if (err) {
      return res.status(400).render('admin/guide-form', { 
        guide: req.body,
        error: err.message 
      });
    }
    next();
  });
};

// RUTAS PÚBLICAS (para usuarios)

// Mostrar todas las guías (página principal de guías)
router.get('/', async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  try {
    const { topic, sort } = req.query;
    let query = {};
    let sortOption = {};

    // Filtro por tema
    if (topic && topic !== 'todos') {
      query.topic = topic;
    }

    // Ordenamiento
    switch (sort) {
      case 'fecha':
        sortOption = { publicationDate: -1 };
        break;
      case 'vistas':
        sortOption = { views: -1 };
        break;
      case 'descargas':
        sortOption = { downloads: -1 };
        break;
      default:
        sortOption = { publicationDate: -1 };
    }

    const guides = await Guide.find(query)
      .populate('author', 'name')
      .sort(sortOption)
      .lean();

    if (cloud.enabled && Array.isArray(guides)) {
      guides.forEach(g => {
        if (g.imagePublicId && (!g.image || (typeof g.image === 'string' && g.image.startsWith('/img/guides/')))) {
          g.image = cloud.buildImageUrl(g.imagePublicId);
        }
      });
    }

    const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
    guides.forEach(g => {
      const log = Array.isArray(g.viewsLog) ? g.viewsLog : [];
      g.views24h = log.filter(ts => new Date(ts).getTime() >= sinceMs).length;
    });
    let candidates = await Guide.find({})
      .populate('author', 'name')
      .sort({ views: -1 })
      .limit(50)
      .lean();
    candidates.forEach(g => {
      const log = Array.isArray(g.viewsLog) ? g.viewsLog : [];
      g.views24h = log.filter(ts => new Date(ts).getTime() >= sinceMs).length;
    });
    candidates.sort((a, b) => (b.views24h || 0) - (a.views24h || 0));
    const popularGuides24h = candidates.slice(0, 3);

    res.render('guides/index', { 
      guides, 
      currentTopic: topic || 'todos',
      currentSort: sort || 'fecha',
      popularGuides24h
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Ver guía específica
router.get('/:id', async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  try {
    const guide = await Guide.findById(req.params.id)
      .populate('author', 'name');
    
    if (!guide) {
      return res.status(404).render('error', { message: 'Guía no encontrada' });
    }
    if (cloud.enabled) {
      if (guide.imagePublicId && !guide.image) {
        guide.image = cloud.buildImageUrl(guide.imagePublicId);
      }
      if (guide.pdfPublicId) {
        guide.pdfFile = `/guides/${guide._id}/view`;
      }
    }

    // Incrementar vistas con control por cookie (evitar doble conteo rápido)
    const cookieKey = `view_guide_${guide._id}`;
    const hasRecentView = req.cookies && req.cookies[cookieKey];
    if (!hasRecentView) {
      guide.views = (guide.views || 0) + 1;
      if (!Array.isArray(guide.viewsLog)) {
        guide.viewsLog = [];
      }
      guide.viewsLog.push(new Date());
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      guide.viewsLog = guide.viewsLog.filter(ts => new Date(ts).getTime() >= sevenDaysAgo);
      await guide.save();
      res.cookie(cookieKey, '1', { maxAge: 5 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    }

    res.render('guides/detail', { guide });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Descargar PDF
router.get('/:id/download', async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  try {
    const guide = await Guide.findById(req.params.id);
    
    if (!guide || !guide.pdfFile) {
      return res.status(404).render('error', { message: 'PDF no encontrado' });
    }

    // Evitar doble conteo usando cookie temporal
    const cookieKey = `dl_guide_${guide._id}`;
    const hasRecent = req.cookies && req.cookies[cookieKey];
    if (!hasRecent) {
      guide.downloads += 1;
      await guide.save();
      res.cookie(cookieKey, '1', { maxAge: 5 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    }

    if (cloud.enabled && guide.pdfPublicId) {
      const unicodeName = (guide.title || 'guia') + '.pdf';
      const asciiName = unicodeName.replace(/[^A-Za-z0-9_.-]/g, '_');
      const encodedName = encodeURIComponent(unicodeName);
      const dl = cloud.buildRawSignedDownloadUrl(guide.pdfPublicId, 'pdf', unicodeName);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
      https.get(dl, upstream => {
        upstream.on('error', () => {
          res.status(502).render('error', { message: 'Error al descargar PDF desde Cloudinary' });
        });
        upstream.pipe(res);
      }).on('error', () => {
        res.status(502).render('error', { message: 'Error al conectar con Cloudinary' });
      });
      return;
    }
    if (/^https?:\/\//.test(guide.pdfFile)) {
      return res.redirect(guide.pdfFile);
    }
    const filePath = path.join(PUBLIC_DIR, guide.pdfFile.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) {
      return res.status(404).render('error', { message: 'El archivo PDF no se encuentra en el servidor' });
    }
    res.download(filePath);
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Ver PDF con proxy (evita errores de formato y fuerza inline)
router.get('/:id/view', async (req, res) => {
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  try {
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).render('error', { message: 'Guía no encontrada' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    const unicodeName = (guide.title || 'guia') + '.pdf';
    const asciiName = unicodeName.replace(/[^A-Za-z0-9_.-]/g, '_');
    const encodedName = encodeURIComponent(unicodeName);
    res.setHeader('Content-Disposition', `inline; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);

    if (cloud.enabled && guide.pdfPublicId) {
      const dl = cloud.buildRawSignedDownloadUrl(guide.pdfPublicId, 'pdf', unicodeName);
      https.get(dl, upstream => {
        upstream.on('error', err => {
          res.status(502).render('error', { message: 'Error al cargar PDF desde Cloudinary' });
        });
        upstream.pipe(res);
      }).on('error', err => {
        res.status(502).render('error', { message: 'Error al conectar con Cloudinary' });
      });
      return;
    }
    if (guide.pdfFile && guide.pdfFile.startsWith('/')) {
      const filePath = path.join(PUBLIC_DIR, guide.pdfFile.replace(/^\//, ''));
      if (!fs.existsSync(filePath)) {
        return res.status(404).render('error', { message: 'El archivo PDF no se encuentra en el servidor' });
      }
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        res.status(500).render('error', { message: 'Error al leer el PDF local' });
      });
      stream.pipe(res);
      return;
    }
    if (/^https?:\/\//.test(guide.pdfFile)) {
      https.get(guide.pdfFile, upstream => {
        upstream.on('error', () => {
          res.status(502).render('error', { message: 'Error al cargar PDF remoto' });
        });
        upstream.pipe(res);
      }).on('error', () => {
        res.status(502).render('error', { message: 'Error al conectar con origen remoto' });
      });
      return;
    }
    res.status(404).render('error', { message: 'PDF no disponible' });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// RUTAS DE ADMINISTRACIÓN (solo para admins)

// Panel de administración de guías
router.get('/admin/dashboard', protect, adminOrPsychologist, async (req, res) => {
  try {
    const { topic, author, q, from, to } = req.query;
    const query = {};
    if (req.user.role === 'psychologist') {
      query.author = req.user._id;
    }
    if (topic && topic !== 'all') {
      query.topic = topic;
    }
    if (author && author !== 'all') {
      const authorUser = await User.findOne({ name: author });
      if (authorUser) {
        query.author = authorUser._id;
      }
    }
    const textFilter = q ? { $or: [ { title: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } } ] } : {};
    if (from || to) {
      query.publicationDate = {};
      if (from) query.publicationDate.$gte = new Date(from);
      if (to) query.publicationDate.$lte = new Date(to);
    }
    const guides = await Guide.find({ ...query, ...textFilter })
      .populate('author', 'name')
      .sort({ publicationDate: -1 });
    
    let allCategories = [];
    let allAuthors = [];
    try {
      const categories = await Guide.distinct('topic');
      if (categories && Array.isArray(categories)) {
        allCategories = categories;
      }
      const authorIds = await Guide.distinct('author');
      if (authorIds && Array.isArray(authorIds)) {
        const authors = await User.distinct('name', { _id: { $in: authorIds } });
        if (authors && Array.isArray(authors)) {
          allAuthors = authors;
        }
      }
    } catch (error) {
      console.error('Error al obtener filtros de guías:', error);
    }
    
    console.log('allCategories:', allCategories);
    
    // Compatibilidad con la vista estilo artículos (usa allTopics)
    const allTopics = allCategories;
    res.render('admin/guides-dashboard', { 
      guides: guides || [], 
      allCategories: allCategories || [],
      allAuthors: allAuthors || [],
      allTopics: allTopics || [],
      currentTopic: topic || 'all',
      currentAuthor: author || 'all',
      currentQ: q || '',
      currentFrom: from || '',
      currentTo: to || ''
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Formulario para crear guía
router.get('/admin/new', protect, adminOrPsychologist, (req, res) => {
  res.render('admin/guide-form', { guide: {} });
});

// Crear guía
router.post('/admin', protect, adminOrPsychologist, uploadGuideFieldsSafe, async (req, res) => {
  try {
    const { title, topic } = req.body;
    
    // Verificar que se haya subido un PDF
    if (!req.files || !req.files.pdfFile) {
      throw new Error('Se requiere un archivo PDF');
    }
    
    const guideData = {
      title,
      topic,
      author: req.user._id
    };

    if (cloud.enabled) {
      const pdfUp = await cloud.uploadRaw(req.files.pdfFile[0].buffer, { folder: 'guides/pdf', format: 'pdf' });
      guideData.pdfFile = pdfUp.url;
      guideData.pdfPublicId = cloud.extractPublicIdFromUrl(pdfUp.url);
      if (req.files.image) {
        const imgUp = await cloud.uploadImage(req.files.image[0].buffer, { folder: 'guides/images' });
        guideData.image = cloud.buildImageUrl(imgUp.public_id);
        guideData.imagePublicId = imgUp.public_id;
      }
    } else {
      guideData.pdfFile = '/pdf/guides/' + req.files.pdfFile[0].filename;
      if (req.files.image) {
        guideData.image = '/img/guides/' + req.files.image[0].filename;
      }
    }


    await Guide.create(guideData);
    res.redirect('/guides/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/guide-form', { 
      guide: req.body,
      error: error.message 
    });
  }
});

// Formulario para editar guía
router.get('/admin/:id/edit', protect, adminOrPsychologist, async (req, res) => {
  try {
    const guide = await Guide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).render('error', { message: 'Guía no encontrada' });
    }
    
    if (req.user.role === 'psychologist' && String(guide.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes editar guías que no sean tuyas' });
    }
    res.render('admin/guide-form', { guide });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Actualizar guía
router.post('/admin/:id', protect, adminOrPsychologist, uploadGuideFieldsSafe, async (req, res) => {
  try {
    const { title, topic } = req.body;
    
    const updateData = { title, topic };

    if (req.files && req.files.image) {
      if (cloud.enabled) {
        const imgUp = await cloud.uploadImage(req.files.image[0].buffer, { folder: 'guides/images' });
        updateData.image = cloud.buildImageUrl(imgUp.public_id);
        updateData.imagePublicId = imgUp.public_id;
      } else {
        updateData.image = '/img/guides/' + req.files.image[0].filename;
      }
    }

    if (req.files && req.files.pdfFile) {
      if (cloud.enabled) {
        const pdfUp = await cloud.uploadRaw(req.files.pdfFile[0].buffer, { folder: 'guides/pdf', format: 'pdf' });
        updateData.pdfFile = pdfUp.url;
        updateData.pdfPublicId = cloud.extractPublicIdFromUrl(pdfUp.url);
      } else {
        updateData.pdfFile = '/pdf/guides/' + req.files.pdfFile[0].filename;
      }
    }

    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).render('error', { message: 'Guía no encontrada' });
    }
    if (req.user.role === 'psychologist' && String(guide.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes editar guías que no sean tuyas' });
    }

    if (req.files && req.files.image) {
      if (cloud.enabled) {
        const oldId = guide.imagePublicId || cloud.extractPublicIdFromUrl(guide.image);
        if (oldId) await cloud.deleteResource(oldId, 'image');
      } else if (guide.image && guide.image.startsWith('/img/guides/')) {
        const p = path.join(PUBLIC_DIR, guide.image.replace(/^\//, ''));
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
    if (req.files && req.files.pdfFile) {
      if (cloud.enabled) {
        const oldId = guide.pdfPublicId || cloud.extractPublicIdFromUrl(guide.pdfFile);
        if (oldId) await cloud.deleteResource(oldId, 'raw');
      } else if (guide.pdfFile && guide.pdfFile.startsWith('/pdf/guides/')) {
        const p = path.join(PUBLIC_DIR, guide.pdfFile.replace(/^\//, ''));
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
    await Guide.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
    
    res.redirect('/guides/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/guide-form', { 
      guide: { ...req.body, _id: req.params.id },
      error: error.message 
    });
  }
});

// Eliminar guía
router.post('/admin/:id/delete', protect, adminOrPsychologist, async (req, res) => {
  try {
    // Obtener la guía para eliminar también los archivos
    const guide = await Guide.findById(req.params.id);
    if (!guide) {
      return res.status(404).render('error', { message: 'Guía no encontrada' });
    }
    if (req.user.role === 'psychologist' && String(guide.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes eliminar guías que no sean tuyas' });
    }

    if (guide.pdfFile) {
      if (cloud.enabled) {
        const oldId = guide.pdfPublicId || cloud.extractPublicIdFromUrl(guide.pdfFile);
        if (oldId) await cloud.deleteResource(oldId, 'raw');
      } else {
        const pdfPath = path.join(PUBLIC_DIR, guide.pdfFile.replace(/^\//, ''));
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      }
    }
    
    if (guide.image) {
      if (cloud.enabled) {
        const oldId = guide.imagePublicId || cloud.extractPublicIdFromUrl(guide.image);
        if (oldId) await cloud.deleteResource(oldId, 'image');
      } else {
        const imagePath = path.join(PUBLIC_DIR, guide.image.replace(/^\//, ''));
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }
    }
    
    await Guide.findByIdAndDelete(req.params.id);
    res.redirect('/guides/admin/dashboard');
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

module.exports = router;
