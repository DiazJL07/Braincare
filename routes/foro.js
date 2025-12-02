const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const { requireNotBanned } = require('../middleware/banMiddleware');


// Editar comentario (PUT)
router.put('/comments/:id', protect, requireNotBanned, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar si el usuario es el autor
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar este comentario' });
    }

    // Verificar si aún es editable (10 minutos)
    const now = new Date();
    const createdAt = new Date(comment.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);
    
    if (diffInMinutes >= 10) {
      return res.status(403).json({ error: 'El tiempo para editar ha expirado (10 minutos)' });
    }

    comment.content = content;
    comment.edited = true;
    await comment.save();

    res.json({ success: true, message: 'Comentario actualizado', content: comment.content });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el comentario' });
  }
});




const Foro = require('../models/Foro');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Topic = require('../models/Topic');

// Middleware de logging para debug


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/img/foro/'),
  filename: (req, file, cb) => {
    const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'foro-' + suffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Solo imágenes permitidas'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Vistas administrativas
router.get('/admin/dashboard', protect, admin, async (req, res) => {
  try {
    const { topic, author, q, from, to } = req.query;
    const query = {};
    if (topic && topic !== 'all') {
      query.topic = topic;
    }
    if (author && author !== 'all') {
      const authorUser = await User.findOne({ name: author });
      if (authorUser) query.author = authorUser._id;
    }
    const textFilter = q ? { $or: [ { title: { $regex: q, $options: 'i' } }, { content: { $regex: q, $options: 'i' } } ] } : {};
    if (from || to) {
      query.publicationDate = {};
      if (from) query.publicationDate.$gte = new Date(from);
      if (to) query.publicationDate.$lte = new Date(to);
    }
    const foros = await Foro.find({ ...query, ...textFilter })
      .populate('author', 'name')
      .populate('topic', 'name')
      .populate('comments')
      .populate('likes')
      .sort({ publicationDate: -1 });
    // Filtros
    let allTopics = [];
    let allAuthors = [];
    try {
      const topicIds = await Foro.distinct('topic');
      const topics = await Topic.find({ _id: { $in: topicIds } }).distinct('name');
      allTopics = topics || [];
      const authorIds = await Foro.distinct('author');
      const authors = await User.distinct('name', { _id: { $in: authorIds } });
      allAuthors = authors || [];
    } catch (err) {}
    res.render('admin/foro-dashboard', { foros, allTopics, allAuthors, currentTopic: topic || 'all', currentAuthor: author || 'all', currentQ: q || '', currentFrom: from || '', currentTo: to || '' });
  } catch (err) {
    res.status(500).render('error', { message: 'Error al cargar el dashboard del foro' });
  }
});

router.get('/admin/new', protect, admin, async (req, res) => {
  try {
    const topics = await Topic.find({}).sort({ name: 1 });
    res.render('admin/foro-form', { foro: {}, topics });
  } catch (err) {
    res.status(500).render('error', { message: 'Error al cargar los temas' });
  }
});

router.post('/admin', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    
    // Validar que el topic sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(topic)) {
      throw new Error('El tema seleccionado no es válido');
    }
    
    const data = {
      title,
      topic,
      content,
      author: req.user._id,
      ...(req.file && { image: '/img/foro/' + req.file.filename })
    };
    await Foro.create(data);
    res.redirect('/foro/admin/dashboard');
  } catch (err) {
    res.status(400).render('admin/foro-form', { foro: req.body, error: err.message });
  }
});

router.get('/admin/:id/edit', protect, admin, async (req, res) => {
  try {
    const foro = await Foro.findById(req.params.id).populate('topic');
    if (!foro) return res.status(404).render('error', { message: 'Foro no encontrado' });
    const topics = await Topic.find({}).sort({ name: 1 });
    res.render('admin/foro-form', { foro, topics });
  } catch (err) {
    res.status(500).render('error', { message: 'Error al cargar el foro' });
  }
});

router.post('/admin/:id', protect, admin, upload.single('image'), async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    
    // Validar que el topic sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(topic)) {
      throw new Error('El tema seleccionado no es válido');
    }
    
    const update = { title, topic, content };
    if (req.file) update.image = '/img/foro/' + req.file.filename;
    await Foro.findByIdAndUpdate(req.params.id, update, { runValidators: true });
    res.redirect('/foro/admin/dashboard');
  } catch (err) {
    res.status(400).render('admin/foro-form', { foro: { ...req.body, _id: req.params.id }, error: err.message });
  }
});

// API para obtener estadísticas en tiempo real
router.get('/admin/api/stats', protect, admin, async (req, res) => {
  try {
    const foros = await Foro.find({})
      .populate('comments')
      .populate('likes')
      .select('_id views likes comments')
      .lean();
    
    const forosWithStats = foros.map(foro => ({
      _id: foro._id,
      views: foro.views || 0,
      likesCount: foro.likes ? foro.likes.length : 0,
      commentsCount: foro.comments ? foro.comments.length : 0
    }));
    
    res.json({ success: true, foros: forosWithStats });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

// Ruta para eliminar foro desde el dashboard de administración
router.delete('/admin/:id', protect, admin, async (req, res) => {
  try {

    
    // Primero eliminar todos los comentarios asociados
    await Comment.deleteMany({ foro: req.params.id });
    
    // Luego eliminar el foro
    const deletedForo = await Foro.findByIdAndDelete(req.params.id);
    
    if (!deletedForo) {
      return res.status(404).json({ success: false, message: 'Foro no encontrado' });
    }
    

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: 'Foro eliminado correctamente', redirectTo: '/foro/admin/dashboard' });
    } else {
      req.flash('success_msg', 'Foro eliminado correctamente');
      res.redirect('/foro/admin/dashboard');
    }
  } catch (err) {

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({ success: false, message: 'Error al eliminar el foro' });
    } else {
      req.flash('error_msg', 'Error al eliminar el foro');
      res.redirect('/foro/admin/dashboard');
    }
  }
});



// Vistas públicas
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
    const query = topic && topic !== 'todos' ? { topic } : {};
    
    // Cargar todos los temas activos para el filtro
    console.log('Loading topics...');
    let topics = [];
    try {
      topics = await Topic.find({}).sort({ name: 1 });
      console.log('Topics loaded:', topics ? topics.length : 'null/undefined');
    } catch (topicError) {
      console.error('Error al cargar los temas:', topicError);
      // Continuar con la ejecución aunque falle la carga de temas
    }
    
    let foros;
    if (sort === 'likes') {
      // Ordenar por cantidad de likes (usando aggregation)
      foros = await Foro.aggregate([
        { $match: query },
        { $addFields: { likesCount: { $size: '$likes' } } },
        { $sort: { likesCount: -1 } },
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { $lookup: { from: 'comments', localField: 'comments', foreignField: '_id', as: 'comments' } },
        { $lookup: { from: 'topics', localField: 'topic', foreignField: '_id', as: 'topic' } },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
        { $project: { 'author.password': 0, 'author.email': 0 } }
      ]);
    } else if (sort === 'comentarios') {
      // Ordenar por cantidad de comentarios (usando aggregation)
      foros = await Foro.aggregate([
        { $match: query },
        { $addFields: { commentsCount: { $size: '$comments' } } },
        { $sort: { commentsCount: -1 } },
        { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
        { $lookup: { from: 'comments', localField: 'comments', foreignField: '_id', as: 'comments' } },
        { $lookup: { from: 'topics', localField: 'topic', foreignField: '_id', as: 'topic' } },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
        { $project: { 'author.password': 0, 'author.email': 0 } }
      ]);
    } else {
      // Ordenamiento tradicional para fecha y vistas
      const sortOption = sort === 'vistas' ? { views: -1 } : { publicationDate: -1 };
      foros = await Foro.find(query)
        .populate('author', 'name profileImage')
        .populate('topic', 'name')
        .populate('comments')
        .sort(sortOption);
    }
    res.render('foro/index', { foros: foros || [], topics: topics || [], currentTopic: topic || 'todos', currentSort: sort || 'fecha' });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
});

// Ruta para que usuarios creen foros - DEBE IR ANTES DE LA RUTA /:id
router.get('/new', protect, requireNotBanned, async (req, res) => {
  try {
    const topics = await Topic.find({}).sort({ name: 1 });
    res.render('foro/create', { foro: {}, topics });
  } catch (err) {
    res.status(500).render('error', { message: 'Error al cargar los temas' });
  }
});

router.get('/:id', async (req, res) => {
  // Verificar si el usuario está autenticado
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  try {
    const foro = await Foro.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('topic', 'name')
      .populate({
        path: 'comments',
        match: { isReply: false }, // Solo comentarios principales, no respuestas
        populate: [
          { path: 'author', select: 'name profileImage' },
          { 
            path: 'replies',
            populate: { path: 'author', select: 'name profileImage' }
          }
        ]
      });
    if (!foro) return res.status(404).render('error', { message: 'Publicación no encontrada' });
    
    // Recalcular flag editable para comentarios y respuestas
    const now = new Date();
    if (foro && Array.isArray(foro.comments)) {
      foro.comments.forEach(comment => {
        const cCreated = new Date(comment.createdAt);
        const cDiff = (now - cCreated) / (1000 * 60);
        comment.editable = cDiff < 10;
        if (Array.isArray(comment.replies)) {
          comment.replies.forEach(reply => {
            const rCreated = new Date(reply.createdAt);
            const rDiff = (now - rCreated) / (1000 * 60);
            reply.editable = rDiff < 10;
          });
        }
      });
    }

    // Solo incrementar vistas si el usuario no ha visto este foro antes
    const userId = res.locals.user._id;
    if (!foro.viewedBy.includes(userId)) {
      foro.views += 1;
      foro.viewedBy.push(userId);
      await foro.save();
    }
    
    res.render('foro/detail', { foro });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
});

// Agregar comentario
router.post('/:id/comments', protect, requireNotBanned, async (req, res) => {
  try {

    const { content, parentCommentId } = req.body;
    const postId = req.params.id;
    
    const foro = await Foro.findById(postId);
    if (!foro) {
      if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
        return res.status(404).json({ message: 'Foro no encontrado' });
      }
      req.flash('error_msg', 'Foro no encontrado');
      return res.redirect('/foro');
    }

    const newComment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      isReply: !!parentCommentId,
      parentComment: parentCommentId || null
    });

    await newComment.save();
    
    // Agregar comentario al post
    foro.comments.push(newComment._id);
    await foro.save();

    // Si es una respuesta, agregar al comentario padre
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(newComment._id);
        await parentComment.save();
      }
    }

    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ 
        message: parentCommentId ? 'Respuesta agregada exitosamente' : 'Comentario agregado exitosamente' 
      });
    }

    req.flash('success_msg', 'Comentario agregado');
    res.redirect(`/foro/${postId}`);
  } catch (err) {
    console.error(err);
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(400).json({ message: 'Error al agregar el comentario' });
    }
    req.flash('error_msg', 'Error al agregar el comentario');
    res.redirect(`/foro/${req.params.id}`);
  }
});

// Like/Unlike comentario
router.post('/comments/:id/like', protect, requireNotBanned, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user._id;

    if (!commentId || commentId === 'undefined' || commentId === 'null') {
      return res.status(400).json({ error: 'ID de comentario inválido' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    const liked = comment.likes.includes(userId);

    let updatedComment;
    if (liked) {
      // Si ya le dio like, quitarlo
      updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Si no le ha dado like, agregarlo
      updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    res.json({
      likes: updatedComment.likes.length,
      liked: !liked
    });
  } catch (err) {
    console.error('Error al procesar el like/unlike del comentario:', err);
    res.status(500).json({ error: 'Error al procesar el like/unlike del comentario' });
  }
});



// Editar comentario (PUT)
router.put('/comments/:id', protect, requireNotBanned, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar si el usuario es el autor
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para editar este comentario' });
    }

    // Verificar si aún es editable (10 minutos)
    const now = new Date();
    const createdAt = new Date(comment.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);
    
    if (diffInMinutes >= 10) {
      return res.status(403).json({ error: 'El tiempo para editar ha expirado (10 minutos)' });
    }

    comment.content = content;
    comment.edited = true;
    await comment.save();

    res.json({ success: true, message: 'Comentario actualizado', content: comment.content });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar el comentario' });
  }
});



// Eliminar comentario
router.delete('/comments/:id', protect, requireNotBanned, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    // Verificar si el usuario es el autor o un administrador
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    }

    // Si es un comentario principal, eliminar también sus respuestas
    if (!comment.isReply) {
      await Comment.deleteMany({ parentComment: comment._id });
    }

    // Si es una respuesta, eliminar la referencia en el comentario padre
    if (comment.isReply && comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          reply => reply.toString() !== comment._id.toString()
        );
        await parentComment.save();
      }
    }

    // Eliminar la referencia en el post
    const post = await Foro.findById(comment.post);
    if (post) {
      post.comments = post.comments.filter(
        commentId => commentId.toString() !== comment._id.toString()
      );
      await post.save();
    }

    await comment.deleteOne();

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el comentario' });
  }
});

// Ruta POST para crear foros

router.post('/', protect, requireNotBanned, upload.single('image'), async (req, res) => {
  try {
    const { title, topic, content } = req.body;
    
    // Validar que el topic sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(topic)) {
      throw new Error('El tema seleccionado no es válido');
    }
    
    const data = {
      title,
      topic,
      content,
      author: req.user._id,
      ...(req.file && { image: '/img/foro/' + req.file.filename })
    };
    await Foro.create(data);
    
    // Verificar si es una petición AJAX
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: 'Publicación creada exitosamente' });
    }
    
    req.flash('success_msg', 'Publicación creada exitosamente');
    res.redirect('/foro');
  } catch (err) {
    // Verificar si es una petición AJAX
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({ message: err.message });
    }
    
    res.status(400).render('foro/create', { foro: req.body, error: err.message });
  }
});

// Ruta para dar like a un foro
router.post('/:id/like', protect, requireNotBanned, async (req, res) => {
  try {
    // Validar que el ID sea válido
    if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
      return res.status(400).json({ error: 'ID de foro inválido' });
    }
    
    const foro = await Foro.findById(req.params.id);
    
    if (!foro) {
      return res.status(404).json({ error: 'Foro no encontrado' });
    }

    const userId = req.user._id;

    const liked = foro.likes.includes(userId);

    let updatedForo;
    if (liked) {
      // Si ya le dio like, quitarlo
      updatedForo = await Foro.findByIdAndUpdate(
        req.params.id,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Si no le ha dado like, agregarlo
      updatedForo = await Foro.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { likes: userId } },
        { new: true }
      );
    }

    res.json({
      likes: updatedForo.likes.length,
      liked: !liked
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al procesar el like' });
  }
});



module.exports = router;
