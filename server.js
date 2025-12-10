const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const child_process = require('child_process');
const path = require('path');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const startIAServer = require('./start-ia-server');
const expressLayouts = require('express-ejs-layouts');

// Cargar rutas
const foroRoutes = require('./routes/foro');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const articleRoutes = require('./routes/articles');
const guideRoutes = require('./routes/guides');
const reportRoutes = require('./routes/reports');
const User = require('./models/User');
const aboutRoutes = require('./routes/about');
const ruta1Routes = require('./routes/ruta1');
const ruta2Routes = require('./routes/ruta2');
const ruta3Routes = require('./routes/ruta3');
const ruta4Routes = require('./routes/ruta4');
const ruta5Routes = require('./routes/ruta5');
const ruta6Routes = require('./routes/ruta6');
const ruta7Routes = require('./routes/ruta7');
const ruta8Routes = require('./routes/ruta8');
const ruta9Routes = require('./routes/ruta9');
const ruta10Routes = require('./routes/ruta10');

const { checkUser } = require('./middleware/authMiddleware');
const { checkBanStatus } = require('./middleware/banMiddleware');

dotenv.config();
// Asegurar secreto JWT por defecto en desarrollo
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';
const app = express();

const PUBLIC_DIR = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.join(__dirname, 'public');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(PUBLIC_DIR));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Configuración de sesión y flash messages
app.use(session({
  secret: process.env.SESSION_SECRET || 'braincare_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hora
}));
app.use(flash());

// Variables globales para mensajes flash
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  next();
});

// Middleware personalizado para manejar métodos HTTP desde formularios
app.use((req, res, next) => {
  if (req.body && req.body._method) {
    const originalMethod = req.method;
    const requestedMethod = req.body._method.toUpperCase();
    
    req.method = requestedMethod;
  }
  next();
});

// Middleware de logging general para debug


app.use(checkUser);
app.use(checkBanStatus);

 

// Rutas
app.get('/', (req, res) => {
  // Asegurarse de que se pasen todas las variables necesarias
  res.render('index', {
    user: res.locals.user,
    title: 'Inicio'
  });
});

// Ruta para notificaciones (accesible para usuarios baneados permanentemente)
app.get('/notifications', (req, res) => {
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  res.render('notifications');
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/api/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/articles', articleRoutes);
app.use('/guides', guideRoutes);
app.use('/foro', foroRoutes);
app.use('/reports', reportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/about', aboutRoutes);
app.use('/ruta1', ruta1Routes);
app.use('/ruta2', ruta2Routes);
app.use('/nosotros', ruta3Routes);
app.use('/coki', ruta4Routes);
app.use('/ruta5', ruta5Routes);
app.use('/ruta6', ruta6Routes);
app.use('/ruta7', ruta7Routes);
app.use('/ruta8', ruta8Routes);
app.use('/ruta9', ruta9Routes);
app.use('/ruta10', ruta10Routes);

app.get('/ruta3', (req, res) => {
  res.redirect(301, '/nosotros');
});
app.get('/ruta4', (req, res) => {
  res.redirect(301, '/coki');
});

// Ruta eliminada - ahora se usa modal en lugar de página separada

// Endpoint para guardado automático de formularios
app.post('/api/auto-save', (req, res) => {
  try {
    const { _autoSave, _formId, _timestamp, ...formData } = req.body;
    
    // Verificar que es una solicitud de guardado automático válida
    if (!_autoSave || !_formId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Solicitud de guardado automático inválida' 
      });
    }
    
    // Log para debugging (opcional)
    console.log(`Guardado automático - Formulario: ${_formId}, Timestamp: ${_timestamp}`);
    console.log('Datos:', formData);
    
    // Aquí puedes agregar lógica específica según el tipo de formulario
    // Por ejemplo, guardar en base de datos, validar permisos, etc.
    
    // Simular guardado exitoso
    res.json({
      success: true,
      message: 'Datos guardados automáticamente',
      timestamp: new Date().toISOString(),
      formId: _formId
    });
    
  } catch (error) {
    console.error('Error en guardado automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Listado público de psicólogos
app.get('/psychologists', async (req, res) => {
  try {
    const psychologists = await User.find({ role: 'psychologist' })
      .select('name profileImage specialty')
      .lean();
    res.render('user/psychologists', {
      title: 'Psicólogos',
      psychologists
    });
  } catch (error) {
    res.status(500).render('error', { message: 'Error al cargar psicólogos' });
  }
});

// Almacén en memoria para conexiones SSE
const sseConnections = new Map();

// Endpoint para sincronización de datos de usuario
app.post('/api/user-sync', (req, res) => {
  try {
    const { userId, field, value, formId, timestamp } = req.body;
    
    // Verificar que es una solicitud válida
    if (!userId || !field || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datos de sincronización inválidos' 
      });
    }
    
    // Log para debugging
    console.log(`🔄 Sincronización - Usuario: ${userId}, Campo: ${field}, Valor: ${value}`);
    
    // Aquí puedes agregar lógica para actualizar la base de datos
    // Por ejemplo, actualizar el usuario en MongoDB
    
    // Preparar datos para broadcast
    const updateData = {
      userId,
      field,
      value,
      formId,
      timestamp: new Date().toISOString(),
      type: 'user_update'
    };
    
    // Enviar actualización a todas las conexiones SSE del usuario
    broadcastToUser(userId, updateData);
    
    res.json({
      success: true,
      message: 'Datos sincronizados correctamente',
      data: updateData
    });
    
  } catch (error) {
    console.error('Error en sincronización de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Endpoint para Server-Sent Events
app.get('/api/user-updates/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Crear ID único para esta conexión
  const connectionId = `${userId}_${Date.now()}_${Math.random()}`;
  
  // Almacenar la conexión
  if (!sseConnections.has(userId)) {
    sseConnections.set(userId, new Map());
  }
  sseConnections.get(userId).set(connectionId, res);
  
  console.log(`📡 Nueva conexión SSE para usuario ${userId} (${connectionId})`);
  
  // Enviar mensaje inicial
  res.write(`data: ${JSON.stringify({
    type: 'connection_established',
    userId: userId,
    connectionId: connectionId,
    timestamp: new Date().toISOString()
  })}\n\n`);
  
  // Manejar desconexión
  req.on('close', () => {
    console.log(`📡 Conexión SSE cerrada para usuario ${userId} (${connectionId})`);
    if (sseConnections.has(userId)) {
      sseConnections.get(userId).delete(connectionId);
      if (sseConnections.get(userId).size === 0) {
        sseConnections.delete(userId);
      }
    }
  });
  
  // Mantener conexión viva
  const keepAlive = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })}\n\n`);
  }, 30000); // Cada 30 segundos
  
  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// Función para enviar actualizaciones a todas las conexiones de un usuario
function broadcastToUser(userId, data) {
  if (sseConnections.has(userId)) {
    const userConnections = sseConnections.get(userId);
    const message = `data: ${JSON.stringify(data)}\n\n`;
    
    userConnections.forEach((res, connectionId) => {
      try {
        res.write(message);
      } catch (error) {
        console.error(`Error enviando a conexión ${connectionId}:`, error);
        userConnections.delete(connectionId);
      }
    });
    
    console.log(`📤 Actualización enviada a ${userConnections.size} conexiones del usuario ${userId}`);
  }
}

// Ruta para la IA
app.get('/ia', (req, res) => {
  if (!res.locals.user) {
    return res.render('error', {
      message: 'Para acceder a esta sección necesitas iniciar sesión o registrarte',
      showAuthButtons: true
    });
  }
  res.render('IA/index', { title: 'Asistente IA', layout: false });
});

// Configurar proxy para la API de IA usando Express
const http = require('http');

// Proxy para la API de Gemini
app.post('/api/gemini', (req, res) => {
  const iaUrlEnv = process.env.IA_URL;
  const iaHost = process.env.IA_HOST || 'localhost';
  const iaPort = parseInt(process.env.IA_PORT || 5001);
  const targetUrl = iaUrlEnv ? new URL(iaUrlEnv) : new URL(`http://${iaHost}:${iaPort}`);
  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? require('https') : require('http');
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: '/api/gemini',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const proxyReq = client.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.status(proxyRes.statusCode).json(jsonData);
      } catch (error) {
        console.error('Error al procesar la respuesta:', error);
        res.status(500).json({ error: 'Error al procesar la respuesta del servicio de IA' });
      }
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Error al conectar con el servicio de IA:', error);
    res.status(500).json({ error: 'Error al conectar con el servicio de IA' });
  });

  // Añadir encabezado X-Session-ID si está presente en la solicitud original
  if (req.headers['x-session-id']) {
    proxyReq.setHeader('X-Session-ID', req.headers['x-session-id']);
  }
  // Añadir encabezado X-User-ID desde sesión si disponible
  const userHeader = (res.locals && res.locals.user && res.locals.user._id) ? String(res.locals.user._id) : 'anon';
  proxyReq.setHeader('X-User-ID', userHeader);

  proxyReq.write(JSON.stringify(req.body));
  proxyReq.end();
});

// Proxy para obtener conversación de IA
app.get('/api/conversation', (req, res) => {
  const iaUrlEnv = process.env.IA_URL;
  const iaHost = process.env.IA_HOST || 'localhost';
  const iaPort = parseInt(process.env.IA_PORT || 5001);
  const targetUrl = iaUrlEnv ? new URL(iaUrlEnv) : new URL(`http://${iaHost}:${iaPort}`);
  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? require('https') : require('http');

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: '/api/conversation',
    method: 'GET',
    headers: {}
  };

  if (req.headers['x-session-id']) {
    options.headers['X-Session-ID'] = req.headers['x-session-id'];
  }
  const userHeader = (res.locals && res.locals.user && res.locals.user._id) ? String(res.locals.user._id) : 'anon';
  options.headers['X-User-ID'] = userHeader;

  const proxyReq = client.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data || '{}');
        res.status(proxyRes.statusCode).json(jsonData);
      } catch (error) {
        console.error('Error al procesar la respuesta de conversación:', error);
        res.status(500).json({ error: 'Error al procesar la respuesta del servicio de IA' });
      }
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Error al conectar con el servicio de IA:', error);
    res.status(500).json({ error: 'Error al conectar con el servicio de IA' });
  });

  proxyReq.end();
});

// Proxy para borrar conversación de IA
app.delete('/api/conversation', (req, res) => {
  const iaUrlEnv = process.env.IA_URL;
  const iaHost = process.env.IA_HOST || 'localhost';
  const iaPort = parseInt(process.env.IA_PORT || 5001);
  const targetUrl = iaUrlEnv ? new URL(iaUrlEnv) : new URL(`http://${iaHost}:${iaPort}`);
  const isHttps = targetUrl.protocol === 'https:';
  const client = isHttps ? require('https') : require('http');

  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || (isHttps ? 443 : 80),
    path: '/api/conversation',
    method: 'DELETE',
    headers: {}
  };

  if (req.headers['x-session-id']) {
    options.headers['X-Session-ID'] = req.headers['x-session-id'];
  }
  const userHeaderDel = (res.locals && res.locals.user && res.locals.user._id) ? String(res.locals.user._id) : 'anon';
  options.headers['X-User-ID'] = userHeaderDel;

  const proxyReq = client.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', (chunk) => { data += chunk; });
    proxyRes.on('end', () => {
      try {
        const jsonData = JSON.parse(data || '{}');
        res.status(proxyRes.statusCode).json(jsonData);
      } catch (error) {
        console.error('Error al procesar la respuesta de borrado:', error);
        res.status(500).json({ error: 'Error al procesar la respuesta del servicio de IA' });
      }
    });
  });

  proxyReq.on('error', (error) => {
    console.error('Error al conectar con el servicio de IA:', error);
    res.status(500).json({ error: 'Error al conectar con el servicio de IA' });
  });

  proxyReq.end();
});

// Iniciar servidores
const PORT = process.env.PORT || 3000;
const IA_PORT = 5001;

// Verificar dependencias de IA antes de iniciar


// Iniciar servidor principal y IA
const startServers = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.URL || 'mongodb://localhost:27017/braincare';
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Conectado a MongoDB');
    // Intentar iniciar el servidor de IA independientemente de si Python está disponible
    const embedIA = (process.env.IA_EMBEDDED || 'true').toLowerCase() !== 'false';
    if (embedIA) {
      console.log('Intentando iniciar servidor de IA...');
      let iaServerStarted = false;
      try {
        const iaProcess = startIAServer();
        if (iaProcess) {
          iaServerStarted = true;
          console.log('Servidor de IA iniciado correctamente');
        } else {
          console.log('No se pudo iniciar el servidor de IA. La funcionalidad de IA no estará disponible.');
        }
      } catch (iaError) {
        console.error('Error al iniciar servidor de IA:', iaError.message);
        console.log('La funcionalidad de IA no estará disponible, pero el servidor principal funcionará normalmente.');
      }
    } else {
      console.log('IA_EMBEDDED=false: omitiendo inicio embebido del servidor de IA. Usando IA_URL/IA_HOST/IA_PORT.');
    }
    
    // Intentar iniciar el servidor con manejo de puerto ocupado
    let currentPort = PORT;
    const maxPortAttempts = 10;
    
    const startMainServer = (port, attempt = 1) => {
      try {
        const server = app.listen(port, () => {
          console.log(`Servidor principal en puerto ${port}`);
          console.log(`Servidor de IA configurado en puerto ${IA_PORT}`);
          console.log('Si el servidor de IA no está disponible, la funcionalidad de IA no funcionará, pero el resto del sitio sí.');
        });
        
        // Manejar errores después de iniciar
        server.on('error', (err) => {
          if (err.code === 'EADDRINUSE' && attempt < maxPortAttempts) {
            console.log(`Puerto ${port} en uso, intentando con puerto ${port + 1}...`);
            server.close();
            startMainServer(port + 1, attempt + 1);
          } else {
            console.error('Error al iniciar el servidor:', err);
            process.exit(1);
          }
        });
        
        return server;
      } catch (error) {
        if (error.code === 'EADDRINUSE' && attempt < maxPortAttempts) {
          console.log(`Puerto ${port} en uso, intentando con puerto ${port + 1}...`);
          return startMainServer(port + 1, attempt + 1);
        } else {
          throw error;
        }
      }
    };
    
    return startMainServer(currentPort);
  } catch (error) {
    console.error('Error al iniciar servidores:', error);
    process.exit(1);
  }
};

startServers();
