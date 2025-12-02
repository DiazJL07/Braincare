const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.render('ruta4/index', {
      user: res.locals.user || null,
      title: 'Ruta 4'
    });
  } catch (error) {
    console.error('Error al cargar la página ruta4:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;