const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.render('ruta3/index', {
      user: res.locals.user || null,
      title: 'Nosotros'
    });
  } catch (error) {
    console.error('Error al cargar la página Nosotros:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;