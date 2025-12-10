const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloud = require('../utils/cloudinary');
const { protect, admin, adminOrPsychologist } = require('../middleware/authMiddleware');
const Article = require('../models/Article');
const User = require('../models/User');

const router = express.Router();

const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.join(__dirname, '..', 'public');

// Configuración de multer para subir imágenes
const storage = cloud.enabled ? multer.memoryStorage() : multer.diskStorage({
  destination: function (req, file, cb) {
    const dest = path.join(PUBLIC_DIR, 'img', 'articles');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'article-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadImageSafe = (req, res, next) => {
  upload.single('image')(req, res, function(err) {
    if (err) {
      return res.status(400).render('admin/article-form', { 
        article: req.body,
        error: err.message 
      });
    }
    next();
  });
};

// RUTAS PÚBLICAS (para usuarios)

// Mostrar todos los artículos (página principal de artículos)
router.get('/', async (req, res) => {
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
      default:
        sortOption = { publicationDate: -1 };
    }

    const articles = await Article.find(query)
      .populate('author', 'name')
      .sort(sortOption)
      .lean();
    if (cloud.enabled && Array.isArray(articles)) {
      articles.forEach(a => {
        if (a.imagePublicId && (!a.image || (typeof a.image === 'string' && a.image.startsWith('/img/articles/')))) {
          a.image = cloud.buildImageUrl(a.imagePublicId);
        }
      });
    }

    const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
    articles.forEach(a => {
      const log = Array.isArray(a.viewsLog) ? a.viewsLog : [];
      a.views24h = log.filter(ts => new Date(ts).getTime() >= sinceMs).length;
    });
    let candidates = await Article.find({})
      .populate('author', 'name')
      .sort({ views: -1 })
      .limit(50)
      .lean();
    candidates.forEach(a => {
      const log = Array.isArray(a.viewsLog) ? a.viewsLog : [];
      a.views24h = log.filter(ts => new Date(ts).getTime() >= sinceMs).length;
    });
    candidates.sort((a, b) => (b.views24h || 0) - (a.views24h || 0));
    const popularArticles24h = candidates.slice(0, 3);

    res.render('articles/index', { 
      articles, 
      currentTopic: topic || 'todos',
      currentSort: sort || 'fecha',
      popularArticles24h
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Ver artículo específico
router.get('/:id', async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  
  try {
    const article = await Article.findById(req.params.id)
      .populate('author', 'name');
    if (cloud.enabled && article) {
      if (article.imagePublicId && (!article.image || (typeof article.image === 'string' && article.image.startsWith('/img/articles/')))) {
        article.image = cloud.buildImageUrl(article.imagePublicId);
      }
    }
    
    if (!article) {
      return res.status(404).render('error', { message: 'Artículo no encontrado' });
    }

    // Incrementar vistas con control por cookie (evitar doble conteo rápido)
    const cookieKey = `view_article_${article._id}`;
    const hasRecentView = req.cookies && req.cookies[cookieKey];
    if (!hasRecentView) {
      article.views = (article.views || 0) + 1;
      if (!Array.isArray(article.viewsLog)) {
        article.viewsLog = [];
      }
      article.viewsLog.push(new Date());
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      article.viewsLog = article.viewsLog.filter(ts => new Date(ts).getTime() >= sevenDaysAgo);
      await article.save();
      res.cookie(cookieKey, '1', { maxAge: 5 * 60 * 1000, httpOnly: false, sameSite: 'lax' });
    }

    res.render('articles/detail', { article });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// RUTAS DE ADMINISTRACIÓN (solo para admins)

// Panel de administración de artículos
router.get('/admin/dashboard', protect, adminOrPsychologist, async (req, res) => {
  try {
    const { topic, author } = req.query;
    let query = {};

    if (topic && topic !== 'all') {
      query.topic = topic;
    }

    if (author && author !== 'all') {
      const authorUser = await User.findOne({ name: author });
      if (authorUser) {
        query.author = authorUser._id;
      }
    }

    // Si es psicólogo, solo sus propios artículos
    if (req.user.role === 'psychologist') {
      query.author = req.user._id;
    }

    const articles = await Article.find(query)
      .populate('author', 'name')
      .sort({ publicationDate: -1 });
    if (cloud.enabled && Array.isArray(articles)) {
      articles.forEach(a => {
        if (a.imagePublicId && (!a.image || (typeof a.image === 'string' && a.image.startsWith('/img/articles/')))) {
          a.image = cloud.buildImageUrl(a.imagePublicId);
        }
      });
    }

    // Inicializar arrays vacíos para evitar errores de undefined
    let allTopics = [];
    let allAuthors = [];
    
    try {
      // Obtener temas distintos
      const topics = await Article.distinct('topic');
      if (topics && Array.isArray(topics)) {
        allTopics = topics;
      }
    } catch (error) {
      console.error('Error al obtener los temas:', error);
      // Mantener allTopics como array vacío en caso de error
    }
    
    try {
      // Obtener autores distintos
      const authorIds = await Article.distinct('author');
      if (authorIds && Array.isArray(authorIds)) {
        const authors = await User.distinct('name', { _id: { $in: authorIds } });
        if (authors && Array.isArray(authors)) {
          allAuthors = authors;
        }
      }
    } catch (error) {
      console.error('Error al obtener los autores:', error);
      // Mantener allAuthors como array vacío en caso de error
    }
    
    // Verificar que allTopics y allAuthors estén definidos antes de renderizar
    console.log('allTopics:', allTopics);
    console.log('allAuthors:', allAuthors);
    
    res.render('admin/articles-dashboard', {
      articles: articles || [],
      allTopics: allTopics || [],
      allAuthors: allAuthors || [],
      currentTopic: topic || 'all',
      currentAuthor: author || 'all'
    });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Formulario para crear artículo
router.get('/admin/new', protect, adminOrPsychologist, (req, res) => {
  res.render('admin/article-form', { article: {} });
});

// Crear artículo
router.post('/admin', protect, adminOrPsychologist, uploadImageSafe, async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    
    const articleData = {
      title,
      topic,
      content,
      author: req.user._id
    };

    if (req.file) {
      if (cloud.enabled) {
        const r = await cloud.uploadImage(req.file.buffer, { folder: 'articles' });
        articleData.image = cloud.buildImageUrl(r.public_id);
        articleData.imagePublicId = r.public_id;
      } else {
        articleData.image = '/img/articles/' + req.file.filename;
      }
    }

    await Article.create(articleData);
    res.redirect('/articles/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/article-form', { 
      article: req.body,
      error: error.message 
    });
  }
});

// Formulario para editar artículo
router.get('/admin/:id/edit', protect, adminOrPsychologist, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    
    if (!article) {
      return res.status(404).render('error', { message: 'Artículo no encontrado' });
    }
    
    // Si es psicólogo, validar propiedad
    if (req.user.role === 'psychologist' && String(article.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes editar artículos que no sean tuyos' });
    }

    res.render('admin/article-form', { article });
  } catch (error) {
    res.status(500).render('error', { message: error.message });
  }
});

// Actualizar artículo
router.post('/admin/:id', protect, adminOrPsychologist, uploadImageSafe, async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    
    const updateData = { title, topic, content };

    if (req.file) {
      if (cloud.enabled) {
        const r = await cloud.uploadImage(req.file.buffer, { folder: 'articles' });
        updateData.image = cloud.buildImageUrl(r.public_id);
        updateData.imagePublicId = r.public_id;
      } else {
        updateData.image = '/img/articles/' + req.file.filename;
      }
    }

    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).render('error', { message: 'Artículo no encontrado' });
    }
    if (req.user.role === 'psychologist' && String(article.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes editar artículos que no sean tuyos' });
    }

    if (req.file) {
      if (cloud.enabled) {
        const oldId = article.imagePublicId || cloud.extractPublicIdFromUrl(article.image);
        if (oldId) {
          await cloud.deleteResource(oldId, 'image');
        }
      } else if (article.image && article.image.startsWith('/img/articles/')) {
        const oldPath = path.join(PUBLIC_DIR, article.image.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }
    await Article.findByIdAndUpdate(req.params.id, updateData, { runValidators: true });
    
    res.redirect('/articles/admin/dashboard');
  } catch (error) {
    res.status(400).render('admin/article-form', { 
      article: { ...req.body, _id: req.params.id },
      error: error.message 
    });
  }
});

// Eliminar artículo
router.post('/admin/:id/delete', protect, adminOrPsychologist, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      console.log('Artículo no encontrado');
      return res.status(404).render('error', { message: 'Artículo no encontrado' });
    }
    if (req.user.role === 'psychologist' && String(article.author) !== String(req.user._id)) {
      return res.status(403).render('error', { message: 'No puedes eliminar artículos que no sean tuyos' });
    }

    if (article && article.image) {
      if (cloud.enabled) {
        const oldId = article.imagePublicId || cloud.extractPublicIdFromUrl(article.image);
        if (oldId) await cloud.deleteResource(oldId, 'image');
      } else if (article.image.startsWith('/img/articles/')) {
        const p = path.join(PUBLIC_DIR, article.image.replace(/^\//, ''));
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    }
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);
    
    if (!deletedArticle) {
      console.log('Artículo no encontrado');
      return res.status(404).render('error', { message: 'Artículo no encontrado' });
    }
    
    console.log('Artículo eliminado correctamente');
    return res.redirect('/articles/admin/dashboard');
  } catch (error) {
    console.error('Error al eliminar artículo:', error);
    res.status(500).render('error', { message: error.message });
  }
});

module.exports = router;
