const User = require('../models/User');

// Middleware para verificar si un usuario está baneado
const checkBanStatus = async (req, res, next) => {
  try {
    // Solo verificar si el usuario está autenticado
    if (req.user) {
      // Obtener información actualizada del usuario desde la base de datos
      const user = await User.findById(req.user._id);
      
      if (!user) {
        // Si el usuario no existe, cerrar sesión
        req.logout((err) => {
          if (err) {
            console.error('Error al cerrar sesión:', err);
          }
          return res.redirect('/auth/login');
        });
        return;
      }

      // Verificar si el usuario está baneado
      if (user.isBanned) {
        // Si es un baneo temporal, verificar si ha expirado
        if (user.banExpiresAt && new Date() > user.banExpiresAt) {
          // El baneo ha expirado, remover el baneo automáticamente
          user.isBanned = false;
          user.banReason = undefined;
          user.banDate = undefined;
          user.banExpiresAt = undefined;
          user.bannedBy = undefined;
          await user.save();
          
          // Actualizar la información del usuario en la sesión
          req.user = user;
          return next();
        }
        
        // El usuario sigue baneado
        // Para usuarios baneados permanentemente (sin fecha de expiración)
        if (!user.banExpiresAt) {
          // Permitir acceso al index, logout, notificaciones, rutas de autenticación y paneles de administración para admins
          const allowedPaths = [
            '/', 
            '/auth/logout', 
            '/auth/login', 
            '/auth/register',
            '/notifications',
            '/api/notifications'
          ];
          console.log('checkBanStatus - Permanent Ban: req.user.isAdmin:', req.user.isAdmin, 'req.path:', req.path);
          // Si el usuario es admin, permitir acceso a todas las rutas de administración
          if (req.user.isAdmin && (
            req.path.includes('/admin/') ||
            req.path.includes('/articles/admin/') ||
            req.path.includes('/guides/admin/') ||
            req.path.includes('/foro/admin/')
          )) {
            return next();
          }
          
          const isAllowedPath = allowedPaths.some(path => 
            req.path === path || 
            req.path.startsWith('/auth/') ||
            req.path.startsWith('/notifications') ||
            req.path.startsWith('/api/notifications')
          );
          
          if (!isAllowedPath) {
            // Verificar si es una petición AJAX
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              return res.status(403).json({
                banned: true,
                permanent: true,
                message: 'Tu cuenta ha sido suspendida permanentemente',
                banReason: user.banReason,
                banDate: user.banDate,
                bannedBy: user.bannedBy
              });
            }
            
            // Redirigir al home con información de baneo
            return res.redirect('/?banned=true');
          }
        } else {
          // Para usuarios con baneo temporal, permitir acceso a paneles de administración para admins
          const allowedPaths = ['/', '/auth/logout', '/auth/login', '/auth/register', '/notifications', '/api/notifications'];
          const isAllowedPath = allowedPaths.some(path => 
            req.path === path || 
            req.path.startsWith('/auth/') ||
            req.path.startsWith('/notifications') ||
            req.path.startsWith('/api/notifications')
          ) || (req.user.isAdmin && (
            req.path.includes('/admin/') ||
            req.path.includes('/articles/admin/') ||
            req.path.includes('/guides/admin/') ||
            req.path.includes('/forum/admin/')
          ));
          
          if (!isAllowedPath) {
            // Verificar si es una petición AJAX
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
              return res.status(403).json({
                banned: true,
                message: 'Tu cuenta ha sido suspendida',
                banReason: user.banReason,
                banDate: user.banDate,
                banExpiresAt: user.banExpiresAt,
                bannedBy: user.bannedBy
              });
            }
            
            // Redirigir al home con información de baneo
            return res.redirect('/?banned=true');
          }
        }
        
        // Marcar al usuario como baneado para el template, solo si no es un admin accediendo a una ruta permitida
        if (!isAllowedPath) {
          req.user.isBannedUser = true;
          req.user.isPermanentlyBanned = !user.banExpiresAt;
        }
      }
      
      // Actualizar la información del usuario en la sesión si es necesario
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Error en middleware de verificación de baneo:', error);
    next();
  }
};

// Middleware específico para rutas que requieren que el usuario NO esté baneado
const requireNotBanned = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      req.logout((err) => {
        if (err) {
          console.error('Error al cerrar sesión:', err);
        }
        return res.redirect('/auth/login');
      });
      return;
    }

    if (user.isBanned) {
      // Verificar si el baneo ha expirado
      if (user.banExpiresAt && new Date() > user.banExpiresAt) {
        user.isBanned = false;
        user.banReason = undefined;
        user.banDate = undefined;
        user.banExpiresAt = undefined;
        user.bannedBy = undefined;
        await user.save();
        
        req.user = user;
        return next();
      }
      
      // Permitir que los administradores accedan a los paneles de administración
      console.log('requireNotBanned: req.user.isAdmin:', req.user.isAdmin, 'req.path:', req.path);
      if (user.isAdmin && (
        req.path.includes('/admin/') ||
        req.path.includes('/articles/admin/') ||
        req.path.includes('/guides/admin/') ||
        req.path.includes('/foro/admin/')
      )) {
        req.user = user;
        return next();
      }
      
      // Verificar si es una petición AJAX
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        // Generar el HTML del contenido de baneo
        const banDateFormatted = user.banDate ? new Date(user.banDate).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Fecha no disponible';
        
        const banExpiresFormatted = user.banExpiresAt ? new Date(user.banExpiresAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric', 
          hour: '2-digit',
          minute: '2-digit'
        }) : null;
        
        const banContent = `
          <div class="banned-container">
            <div class="banned-icon">
              <i class="fas fa-ban"></i>
            </div>
            
            <h1 class="banned-title">Cuenta Suspendida</h1>
            <p class="banned-subtitle">Tu cuenta ha sido suspendida</p>
            
            <div class="ban-info">
              <div class="ban-detail">
                <strong>Fecha del baneo:</strong>
                ${banDateFormatted}
              </div>
              
              ${user.banExpiresAt ? `
                <div class="ban-detail">
                  <strong>Expira el:</strong>
                  ${banExpiresFormatted}
                </div>
              ` : `
                <div class="ban-detail">
                  <strong>Tipo:</strong>
                  <span class="badge bg-danger">Baneo Permanente</span>
                </div>
              `}
              
              ${user.banReason ? `
                <div class="ban-reason">
                  <strong><i class="fas fa-exclamation-triangle"></i> Razón del baneo:</strong><br>
                  ${user.banReason}
                </div>
              ` : ''}
            </div>
            
            <div class="contact-info">
              <h5><i class="fas fa-envelope"></i> ¿Crees que esto es un error?</h5>
              <p class="mb-2">Si consideras que tu cuenta fue suspendida por error, puedes contactar con nuestro equipo de soporte.</p>
              <small class="text-muted">
                <i class="fas fa-info-circle"></i>
                Incluye tu nombre de usuario y una descripción detallada de tu situación.
              </small>
            </div>
            
            <a href="/logout" class="btn-home">
              <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </a>
          </div>
        `;
        
        return res.status(403).json({
          banned: true,
          message: 'Tu cuenta ha sido suspendida',
          banReason: user.banReason,
          banDate: user.banDate,
          banExpiresAt: user.banExpiresAt,
          bannedBy: user.bannedBy,
          banContent: banContent
        });
      }
      
      return res.render('banned', { user });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Error en middleware requireNotBanned:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
};

module.exports = {
  checkBanStatus,
  requireNotBanned
};