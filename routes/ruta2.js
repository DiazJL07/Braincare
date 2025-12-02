const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.render('ruta2/index', {
      user: res.locals.user || null,
      title: 'Ruta 2'
    });
  } catch (error) {
    console.error('Error al cargar la página ruta2:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;