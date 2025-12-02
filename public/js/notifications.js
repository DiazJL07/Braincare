// Sistema de notificaciones dinámico

// Evitar declaración duplicada
if (typeof window.NotificationSystem === 'undefined') {
  window.NotificationSystem = class NotificationSystem {
  constructor() {
    this.unreadCount = 0;
    this.notifications = [];
    this.isAdmin = false;
    this.init();
  }

  init() {
    // Detectar si es admin
    this.isAdmin = document.getElementById('adminNotificationsBell') !== null;
    
    // Cargar notificaciones al iniciar
    this.loadNotifications();
    
    // Configurar eventos
    this.setupEventListeners();
    
    // Verificar nuevas notificaciones cada 30 segundos
    setInterval(() => {
      this.checkForNewNotifications();
    }, 30000);
  }

  setupEventListeners() {
    // Cerrar modal al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('notification-modal')) {
        this.closeModal();
      }
    });

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
      }
    });
  }

  async loadNotifications() {
    try {
      const endpoint = this.isAdmin ? '/admin/api/notifications' : '/user/notifications';
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
        this.updateNotificationCount();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async checkForNewNotifications() {
    const previousCount = this.unreadCount;
    await this.loadNotifications();
    
    // Si hay nuevas notificaciones, animar la campana
    if (this.unreadCount > previousCount) {
      this.animateBell();
    }
  }

  updateNotificationCount() {
    // Calcular el número real de notificaciones no leídas
    const actualUnreadCount = this.notifications.filter(n => !n.read).length;
    this.unreadCount = actualUnreadCount;
    
    // Buscar el badge en cualquiera de los posibles IDs
    const badge = document.getElementById('notificationBadge') || 
                  document.getElementById('adminNotificationBadge') || 
                  document.getElementById('userNotificationBadge');
    
    if (badge) {
      if (actualUnreadCount > 0) {
        badge.textContent = actualUnreadCount;
        badge.style.display = 'inline-block';
        badge.classList.add('pulse');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('pulse');
      }
    }
  }

  animateBell() {
    const bellId = this.isAdmin ? 'adminNotificationsBell' : 'userNotificationsBell';
    const bell = document.getElementById(bellId);
    
    if (bell) {
      const icon = bell.querySelector('.fas.fa-bell');
      if (icon) {
        icon.classList.add('bell-shake');
        setTimeout(() => {
          icon.classList.remove('bell-shake');
        }, 800);
      }
    }
  }

  async markAsRead(notificationId) {
    try {
      const endpoint = this.isAdmin ? '/admin/api/notifications/mark-read' : '/user/notifications/mark-read';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado local
        const notificationIndex = this.notifications.findIndex(n => n._id === notificationId);
        if (notificationIndex !== -1 && !this.notifications[notificationIndex].read) {
          // Eliminar la notificación del array local
          this.notifications.splice(notificationIndex, 1);
          // Decrementar el contador de no leídas
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        
        // Actualizar el contador inmediatamente
        this.updateNotificationCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      const endpoint = this.isAdmin ? '/admin/api/notifications/mark-all-read' : '/user/notifications/mark-all-read';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        // Marcar todas como leídas localmente
        this.notifications.forEach(notification => {
          notification.read = true;
        });
        
        // Resetear el contador a 0
        this.unreadCount = 0;
        
        // Re-renderizar el contenido del modal
        this.renderModalContent();
        
        // Actualizar el contador inmediatamente
        this.updateNotificationCount();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  openModal() {
    let modal = document.getElementById('notificationModal');
    
    if (!modal) {
      modal = this.createModal();
      document.body.appendChild(modal);
    }
    
    this.renderModalContent();
    modal.style.display = 'flex';
    
    // Animar entrada
    setTimeout(() => {
      modal.style.opacity = '1';
    }, 10);
  }

  closeModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
      modal.style.opacity = '0';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
  }

  createModal() {
    const modal = document.createElement('div');
    modal.id = 'notificationModal';
    modal.className = 'notification-modal';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    
    modal.innerHTML = `
      <div class="notification-modal-content">
        <div class="notification-modal-header">
          <h3 class="notification-modal-title">${this.isAdmin ? 'Notificaciones de Reportes' : 'Notificaciones'}</h3>
          <button class="notification-modal-close" onclick="notificationSystem.closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="notification-modal-body" id="notificationModalBody">
          <!-- Content will be rendered here -->
        </div>
      </div>
    `;
    
    return modal;
  }

  renderModalContent() {
    const modalBody = document.getElementById('notificationModalBody');
    if (!modalBody) return;

    if (this.notifications.length === 0) {
      modalBody.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No hay notificaciones nuevas</p>
        </div>
      `;
      return;
    }

    const notificationsHTML = this.notifications.map(notification => {
      const timeAgo = this.getTimeAgo(notification.createdAt);
      const isUnread = !notification.read;
      const iconClass = this.getNotificationIcon(notification.type);
      const actionBadge = this.getActionBadge(notification.actionTaken);
      
      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification._id}" onclick="notificationSystem.handleNotificationClick('${notification._id}')">
          <div class="notification-icon">
            <i class="${iconClass}"></i>
          </div>
          <div class="notification-content">
            <div class="notification-header">
              <h6 class="notification-title">${notification.title}</h6>
              <small class="notification-time">${timeAgo}</small>
            </div>
            <p class="notification-message">${notification.message}</p>
            ${actionBadge}
            ${isUnread ? `<span class="unread-indicator"><i class="fas fa-circle"></i></span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    modalBody.innerHTML = `
      <div class="notifications-list">
        ${notificationsHTML}
      </div>
      ${this.notifications.some(n => !n.read) ? `
        <div class="text-center mt-3">
          <button class="btn btn-outline-primary" onclick="notificationSystem.markAllAsRead()">
            Marcar todas como leídas
          </button>
        </div>
      ` : ''}
    `;
  }

  handleNotificationClick(notificationId) {
    const notification = this.notifications.find(n => n._id === notificationId);
    if (notification && !notification.read) {
      // Actualizar inmediatamente la UI local
      const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
      if (notificationElement) {
        // Añadir animación de salida
        notificationElement.style.transition = 'all 0.3s ease-out';
        notificationElement.style.transform = 'translateX(100%)';
        notificationElement.style.opacity = '0';
        
        // Eliminar el elemento después de la animación
        setTimeout(() => {
          notificationElement.remove();
          
          // Verificar si no quedan notificaciones y mostrar mensaje
          this.checkAndShowEmptyState();
        }, 300);
      }
      
      // Marcar como leída en el servidor
      this.markAsRead(notificationId);
    }
  }

  checkAndShowEmptyState() {
    const modalBody = document.getElementById('notificationModalBody');
    const remainingNotifications = modalBody.querySelectorAll('.notification-item');
    
    if (remainingNotifications.length === 0) {
      modalBody.innerHTML = `
        <div class="no-notifications">
          <i class="fas fa-bell-slash"></i>
          <p>No hay notificaciones nuevas</p>
        </div>
      `;
    }
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'warning': return 'fas fa-exclamation-triangle text-warning';
      case 'ban': return 'fas fa-ban text-danger';
      case 'report_resolved': return 'fas fa-gavel text-info';
      case 'new_report': return 'fas fa-flag text-warning';
      default: return 'fas fa-bell text-primary';
    }
  }

  getActionBadge(action) {
    if (!action || action === 'none') return '';
    
    const badges = {
      'warning': '<span class="badge bg-warning text-dark ms-2">Advertencia</span>',
      'temp_ban': '<span class="badge bg-danger ms-2">Baneo temporal</span>',
      'permanent_ban': '<span class="badge bg-dark ms-2">Baneo permanente</span>'
    };
    
    return badges[action] || '';
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  }
}

}

// Instancia global del sistema de notificaciones
window.notificationSystem = window.notificationSystem || null;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (!window.notificationSystem && window.NotificationSystem) {
    window.notificationSystem = new window.NotificationSystem();
  }
});

// Funciones globales para compatibilidad
function openNotificationsModal() {
  if (window.notificationSystem) {
    window.notificationSystem.openModal();
  }
}

function openAdminNotificationsModal() {
  if (window.notificationSystem) {
    window.notificationSystem.openModal();
  }
}

// Función para simular nuevas notificaciones (para testing)
function simulateNewNotification() {
  if (window.notificationSystem) {
    window.notificationSystem.checkForNewNotifications();
  }
}