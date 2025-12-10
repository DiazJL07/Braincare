const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    res.render('ruta4/index', {
      user: res.locals.user || null,
      title: 'Coki Home'
    });
  } catch (error) {
    console.error('Error al cargar la página Coki Home:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

module.exports = router;