const express = require('express');
const { checkUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware para verificar usuario (opcional)
router.use(checkUser);

router.get('/', async (req, res) => {
  try {
    res.render('ruta10/index', {
      user: req.user || null,
      title: 'Ruta 10'
    });
  } catch (error) {
    console.error('Error al cargar la página ruta10:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;