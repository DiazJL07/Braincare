/**
 * Sistema de Sincronización en Tiempo Real
 * Actualiza automáticamente los datos del usuario en toda la interfaz
 */

if (typeof RealTimeSync === 'undefined') {
class RealTimeSync {
    constructor(userConfig = {}) {
        this.userId = userConfig.userId || null;
        this.userName = userConfig.userName || null;
        this.userEmail = userConfig.userEmail || null;
        this.userRole = userConfig.userRole || null;
        this.eventSource = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        if (this.userId) {
            this.init();
        }
    }

    init() {
        // Obtener ID del usuario actual
        this.getUserId();
        
        // Configurar eventos de red
        this.setupNetworkEvents();
        
        // Configurar Server-Sent Events
        this.setupSSE();
        
        // Configurar sincronización entre pestañas
        this.setupCrossTabSync();
        
        // Configurar observadores de cambios
        this.setupChangeObservers();
        
        console.log('🔄 Sistema de sincronización en tiempo real iniciado');
    }

    getUserId() {
        // Intentar obtener el ID del usuario desde diferentes fuentes
        const userElement = document.querySelector('[data-user-id]');
        if (userElement) {
            this.userId = userElement.getAttribute('data-user-id');
        } else {
            // Buscar en elementos del DOM que contengan información del usuario
            const profileLink = document.querySelector('a[href*="/user/profile"]');
            if (profileLink) {
                const href = profileLink.getAttribute('href');
                const match = href.match(/\/user\/profile\/(\w+)/);
                if (match) {
                    this.userId = match[1];
                }
            }
        }
    }

    setupNetworkEvents() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processSyncQueue();
            this.setupSSE();
            console.log('🌐 Conexión restaurada - sincronizando cambios pendientes');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            if (this.eventSource) {
                this.eventSource.close();
            }
            console.log('📴 Sin conexión - cambios se guardarán localmente');
        });
    }

    setupSSE() {
        if (!this.isOnline || !this.userId) return;

        // Cerrar conexión anterior si existe
        if (this.eventSource) {
            this.eventSource.close();
        }

        // Crear nueva conexión SSE
        this.eventSource = new EventSource(`/api/user-updates/${this.userId}`);

        this.eventSource.onopen = () => {
            console.log('✅ Conexión SSE establecida');
            this.retryAttempts = 0;
        };

        this.eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleUserUpdate(data);
            } catch (error) {
                console.error('Error procesando actualización:', error);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('Error en SSE:', error);
            this.eventSource.close();
            
            if (this.retryAttempts < this.maxRetries) {
                this.retryAttempts++;
                setTimeout(() => {
                    console.log(`🔄 Reintentando conexión SSE (${this.retryAttempts}/${this.maxRetries})`);
                    this.setupSSE();
                }, this.retryDelay * this.retryAttempts);
            }
        };
    }

    setupCrossTabSync() {
        // Usar localStorage para sincronizar entre pestañas
        window.addEventListener('storage', (event) => {
            if (event.key === 'userDataUpdate') {
                try {
                    const data = JSON.parse(event.newValue);
                    if (data.userId === this.userId) {
                        this.handleUserUpdate(data, false); // false = no propagar a otras pestañas
                    }
                } catch (error) {
                    console.error('Error en sincronización entre pestañas:', error);
                }
            }
        });
    }

    setupChangeObservers() {
        // Observar cambios en formularios de usuario
        const userForms = document.querySelectorAll('form[data-auto-save="true"]');
        
        userForms.forEach(form => {
            const inputs = form.querySelectorAll('input[data-validate="true"], select[data-validate="true"]');
            
            inputs.forEach(input => {
                input.addEventListener('input', (event) => {
                    this.debounce(() => {
                        this.handleFieldChange(event.target);
                    }, 500)();
                });

                input.addEventListener('change', (event) => {
                    this.handleFieldChange(event.target);
                });
            });
        });
    }

    handleFieldChange(field) {
        const fieldName = field.name;
        const fieldValue = field.value;
        const formId = field.closest('form').getAttribute('data-form-id');

        // Preparar datos para sincronización
        const updateData = {
            userId: this.userId,
            field: fieldName,
            value: fieldValue,
            formId: formId,
            timestamp: new Date().toISOString()
        };

        // Enviar actualización al servidor
        this.sendUpdate(updateData);

        // Actualizar inmediatamente en la interfaz local
        this.updateLocalInterface(updateData);
    }

    async sendUpdate(data) {
        if (!this.isOnline) {
            // Guardar en cola para enviar cuando haya conexión
            this.syncQueue.push(data);
            this.saveToLocalStorage(data);
            return;
        }

        try {
            const response = await fetch('/api/user-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Actualización sincronizada:', result);
                
                // Propagar a otras pestañas
                this.propagateToTabs(data);
            } else {
                throw new Error('Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error enviando actualización:', error);
            this.syncQueue.push(data);
            this.saveToLocalStorage(data);
        }
    }

    handleUserUpdate(data, propagate = true) {
        console.log('📥 Recibida actualización de usuario:', data);
        
        // Actualizar interfaz
        this.updateLocalInterface(data);
        
        // Propagar a otras pestañas si es necesario
        if (propagate) {
            this.propagateToTabs(data);
        }
    }

    updateLocalInterface(data) {
        const { field, value } = data;

        // Actualizar campos específicos según el tipo
        switch (field) {
            case 'name':
                this.updateUserName(value);
                break;
            case 'email':
                this.updateUserEmail(value);
                break;
            case 'role':
                this.updateUserRole(value);
                break;
            default:
                this.updateGenericField(field, value);
        }

        // Mostrar indicador de sincronización
        this.showSyncIndicator();
    }

    updateUserName(newName) {
        // Actualizar en header
        const headerName = document.querySelector('.user-name, [data-user-name]');
        if (headerName) {
            headerName.textContent = newName;
        }

        // Actualizar en tablas
        const tableCells = document.querySelectorAll('td[data-field="name"], .user-name-cell');
        tableCells.forEach(cell => {
            cell.textContent = newName;
        });

        // Actualizar en perfiles
        const profileNames = document.querySelectorAll('.profile-name, [data-profile-name]');
        profileNames.forEach(element => {
            element.textContent = newName;
        });

        // Actualizar en comentarios y posts
        const authorNames = document.querySelectorAll('.comment-author, .post-author, [data-author-name]');
        authorNames.forEach(element => {
            if (element.getAttribute('data-user-id') === this.userId) {
                element.textContent = newName;
            }
        });
    }

    updateUserEmail(newEmail) {
        // Actualizar campos de email
        const emailElements = document.querySelectorAll('[data-field="email"], .user-email');
        emailElements.forEach(element => {
            if (element.tagName === 'INPUT') {
                element.value = newEmail;
            } else {
                element.textContent = newEmail;
            }
        });
    }

    updateUserRole(newRole) {
        // Actualizar indicadores de rol
        const roleElements = document.querySelectorAll('[data-field="role"], .user-role');
        roleElements.forEach(element => {
            if (element.tagName === 'SELECT') {
                element.value = newRole;
            } else {
                element.textContent = this.formatRole(newRole);
            }
        });

        // Actualizar badges de rol
        const roleBadges = document.querySelectorAll('.role-badge, [data-role-badge]');
        roleBadges.forEach(badge => {
            badge.className = `role-badge role-${newRole}`;
            badge.textContent = this.formatRole(newRole);
        });
    }

    updateGenericField(fieldName, value) {
        // Actualizar campos genéricos
        const elements = document.querySelectorAll(`[data-field="${fieldName}"]`);
        elements.forEach(element => {
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        });
    }

    formatRole(role) {
        const roleMap = {
            'admin': '👑 Administrador',
            'user': '👤 Usuario',
            'moderator': '🛡️ Moderador'
        };
        return roleMap[role] || role;
    }

    showSyncIndicator() {
        // Crear o mostrar indicador de sincronización
        let indicator = document.getElementById('sync-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'sync-indicator';
            indicator.className = 'sync-indicator';
            indicator.innerHTML = '✅ Sincronizado';
            document.body.appendChild(indicator);
        }

        indicator.classList.add('show');
        
        // Ocultar después de 2 segundos
        setTimeout(() => {
            indicator.classList.remove('show');
        }, 2000);
    }

    propagateToTabs(data) {
        // Enviar a otras pestañas usando localStorage
        localStorage.setItem('userDataUpdate', JSON.stringify(data));
        
        // Limpiar después de un momento para evitar acumulación
        setTimeout(() => {
            localStorage.removeItem('userDataUpdate');
        }, 1000);
    }

    saveToLocalStorage(data) {
        // Guardar cambios pendientes en localStorage
        const pendingChanges = JSON.parse(localStorage.getItem('pendingUserChanges') || '[]');
        pendingChanges.push(data);
        localStorage.setItem('pendingUserChanges', JSON.stringify(pendingChanges));
    }

    async processSyncQueue() {
        // Procesar cambios pendientes cuando se restaure la conexión
        const pendingChanges = JSON.parse(localStorage.getItem('pendingUserChanges') || '[]');
        
        for (const change of pendingChanges) {
            await this.sendUpdate(change);
        }
        
        // Limpiar cambios pendientes
        localStorage.removeItem('pendingUserChanges');
        this.syncQueue = [];
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    destroy() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        console.log('🔄 Sistema de sincronización desconectado');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeSync = new RealTimeSync();
});

// Limpiar al cerrar la página
window.addEventListener('beforeunload', () => {
    if (window.realTimeSync) {
        window.realTimeSync.destroy();
    }
});

}