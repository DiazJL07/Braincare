// Sistema de estadísticas de usuario en tiempo real
class UserStatsManager {
    constructor(userId) {
        this.userId = userId;
        this.updateInterval = 30000; // 30 segundos
        this.activityUpdateInterval = 45000; // 45 segundos para actividad
        this.isUpdating = false;
        this.isUpdatingActivity = false;
        this.lastUpdate = null;
        this.lastActivityUpdate = null;
        
        this.init();
    }
    
    init() {
        this.setupRealTimeUpdates();
        this.setupActivityUpdates();
        // Indicador de estadísticas eliminado
        console.log('📊 Sistema de estadísticas y actividad de usuario iniciado');
    }
    
    // Configurar actualizaciones automáticas
    setupRealTimeUpdates() {
        // Actualización inicial después de 5 segundos
        setTimeout(() => {
            this.updateUserStats();
        }, 5000);
        
        // Actualizaciones periódicas
        setInterval(() => {
            this.updateUserStats();
        }, this.updateInterval);
    }
    
    // Configurar actualizaciones de actividad
    setupActivityUpdates() {
        // Actualización inicial de actividad después de 8 segundos
        setTimeout(() => {
            this.updateUserActivity();
        }, 8000);
        
        // Actualizaciones periódicas de actividad
        setInterval(() => {
            this.updateUserActivity();
        }, this.activityUpdateInterval);
    }
    
    // Actualizar estadísticas del usuario
    async updateUserStats() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        // Indicador eliminado
        
        try {
            const response = await fetch(`/admin/users/${this.userId}/api/stats`);
            const data = await response.json();
            
            if (data.success) {
                this.animateStatsUpdate(data.stats);
                this.lastUpdate = new Date();
                console.log('📈 Estadísticas actualizadas:', data.stats);
            }
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        } finally {
            this.isUpdating = false;
            // Indicador eliminado
        }
    }
    
    // Actualizar actividad del usuario
    async updateUserActivity() {
        if (this.isUpdatingActivity) return;
        
        this.isUpdatingActivity = true;
        this.showActivityUpdateIndicator();
        
        try {
            const response = await fetch(`/admin/users/${this.userId}/api/activity`);
            const data = await response.json();
            
            if (data.success) {
                this.updateActivityTimeline(data.activity);
                this.lastActivityUpdate = new Date();
                console.log('📅 Timeline de actividad actualizado:', data.activity.length, 'elementos');
            }
        } catch (error) {
            console.error('Error al actualizar actividad:', error);
        } finally {
            this.isUpdatingActivity = false;
            this.hideActivityUpdateIndicator();
        }
    }
    
    // Actualizar timeline de actividad
    updateActivityTimeline(newActivity) {
        const timelineContainer = document.querySelector('.activity-timeline');
        if (!timelineContainer) return;
        
        // Buscar el contenedor de elementos del timeline
        let timelineItems = timelineContainer.querySelector('.timeline-items');
        if (!timelineItems) {
            // Si no existe, crear el contenedor
            timelineItems = document.createElement('div');
            timelineItems.className = 'timeline-items';
            timelineContainer.appendChild(timelineItems);
        }
        
        // Limpiar timeline actual
        timelineItems.innerHTML = '';
        
        if (newActivity.length === 0) {
            timelineItems.innerHTML = `
                <div class="no-activity-message">
                    <i class="fas fa-clock"></i>
                    <p>Sin actividad reciente</p>
                </div>
            `;
            return;
        }
        
        // Agregar nuevos elementos con animación
        newActivity.forEach((activity, index) => {
            const timelineItem = this.createTimelineItem(activity);
            timelineItem.style.animationDelay = `${index * 0.1}s`;
            timelineItems.appendChild(timelineItem);
        });
    }
    
    // Crear elemento del timeline
    createTimelineItem(activity) {
        const item = document.createElement('div');
        item.className = 'timeline-item animate-fade-in';
        
        const date = new Date(activity.date);
        const timeAgo = this.getTimeAgo(date);
        
        item.innerHTML = `
            <div class="timeline-icon ${activity.color}">
                <i class="${activity.icon}"></i>
            </div>
            <div class="timeline-content">
                <div class="timeline-title">${activity.title}</div>
                <div class="timeline-date">${timeAgo}</div>
            </div>
        `;
        
        return item;
    }
    
    // Calcular tiempo transcurrido
    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Hace menos de un minuto';
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
    
    // Animar actualización de estadísticas
    animateStatsUpdate(newStats) {
        const statElements = {
            publicaciones: document.querySelector('.stat-card:nth-child(2) .stat-number'),
            comentarios: document.querySelector('.stat-card:nth-child(3) .stat-number'),
            reportes: document.querySelector('.stat-card:nth-child(4) .stat-number'),
            perfilActivo: document.querySelector('.stat-card:nth-child(1) .stat-number')
        };
        
        Object.keys(newStats).forEach(key => {
            const element = statElements[key];
            if (element) {
                const currentValue = parseInt(element.textContent) || 0;
                const newValue = newStats[key];
                
                if (currentValue !== newValue) {
                    this.animateNumber(element, currentValue, newValue);
                    this.highlightChange(element.closest('.stat-card'));
                }
            }
        });
    }
    
    // Animar cambio de número
    animateNumber(element, from, to) {
        const duration = 1000;
        const steps = 30;
        const stepValue = (to - from) / steps;
        let current = from;
        let step = 0;
        
        const timer = setInterval(() => {
            current += stepValue;
            step++;
            
            element.textContent = Math.round(current);
            
            if (step >= steps) {
                clearInterval(timer);
                element.textContent = to;
            }
        }, duration / steps);
    }
    
    // Resaltar cambio en tarjeta
    highlightChange(card) {
        card.style.transform = 'scale(1.05)';
        card.style.boxShadow = '0 8px 25px rgba(0, 123, 255, 0.3)';
        card.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            card.style.transform = 'scale(1)';
            card.style.boxShadow = '';
        }, 500);
    }
    
    // Función de indicador eliminada
    
    // Funciones de indicador eliminadas
    
    // Mostrar indicador de actualización de actividad
    showActivityUpdateIndicator() {
        const indicator = document.querySelector('.activity-update-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Actualizando actividad...';
        }
    }
    
    // Ocultar indicador de actualización de actividad
    hideActivityUpdateIndicator() {
        const indicator = document.querySelector('.activity-update-indicator');
        if (indicator) {
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 1000);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Obtener el ID del usuario desde la URL
    const pathParts = window.location.pathname.split('/');
    const userId = pathParts[pathParts.indexOf('users') + 1];
    
    if (userId && userId !== 'new') {
        window.userStatsManager = new UserStatsManager(userId);
    }
});

// Exportar para uso global
window.UserStatsManager = UserStatsManager;