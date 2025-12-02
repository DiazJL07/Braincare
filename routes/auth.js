const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Mostrar página de registro
router.get('/register', (req, res) => {
  res.render('auth/register');
});

// Procesar registro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).render('auth/register', {
        error: 'El usuario ya existe',
        name,
        email
      });
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password
    });

    // Generar token
    const token = generateToken(user._id);

    // Establecer cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días
    });

    res.redirect('/');
  } catch (error) {
    res.status(400).render('auth/register', {
      error: error.message,
      name,
      email
    });
  }
});

// Mostrar página de inicio de sesión
router.get('/login', (req, res) => {
  res.render('auth/login');
});

// Procesar inicio de sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).render('auth/login', {
        error: 'El correo electrónico no está registrado',
        email
      });
    }
    
    if (!(await user.matchPassword(password))) {
      return res.status(401).render('auth/login', {
        error: 'La contraseña es incorrecta',
        email
      });
    }

    // Generar token
    const token = generateToken(user._id);

    // Establecer cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      secure: process.env.NODE_ENV === 'production', // Solo en producción
      sameSite: 'strict' // Protección contra CSRF
    });

    // Redirigir según el rol
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    if (user.role === 'psychologist') {
      return res.redirect('/articles/admin/dashboard');
    }
    return res.redirect('/');
  } catch (error) {
    res.status(400).render('auth/login', {
      error: error.message,
      email
    });
  }
});

// Validar contraseña en tiempo real
router.post('/validate-login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verificar que se proporcionen email y password
    if (!email || !password) {
      return res.json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);
    
    if (isMatch) {
      return res.json({
        success: true,
        message: 'Contraseña correcta',
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      return res.json({
        success: false,
        message: 'Contraseña incorrecta'
      });
    }

  } catch (error) {
    console.error('Error al validar login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Cerrar sesión
router.get('/logout', (req, res) => {
  // Eliminar la cookie JWT
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  // Establecer encabezados para evitar el almacenamiento en caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  
  // Redirigir a la página de inicio
  res.redirect('/');
});

module.exports = router;