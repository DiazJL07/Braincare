const express = require('express');
const { checkUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware para verificar usuario (opcional)
router.use(checkUser);

router.get('/', async (req, res) => {
  try {
    res.render('ruta9/index', {
      user: req.user || null,
      title: 'Ruta 9'
    });
  } catch (error) {
    console.error('Error al cargar la página ruta9:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;