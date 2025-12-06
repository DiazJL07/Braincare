// Validador de contraseña para el formulario de actualizar perfil
document.addEventListener('DOMContentLoaded', function() {
    const currentPasswordInput = document.getElementById('currentPassword');
    
    if (!currentPasswordInput) return;

    let validationTimeout;

    // Función para crear botón de mostrar/ocultar contraseña
    function createTogglePasswordButton(input) {
        const container = input.parentElement;
        
        // Verificar si ya existe el botón
        if (container.querySelector('.password-toggle-btn')) return;
        
        // Agregar estilos al contenedor
        container.style.position = 'relative';
        
        // Crear botón de toggle
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle-btn';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.title = 'Mostrar contraseña';
        
        // Estilos del botón
        Object.assign(toggleBtn.style, {
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            zIndex: '10',
            padding: '2px',
            borderRadius: '3px'
        });
        
        // Ajustar padding del input
        input.style.paddingRight = '40px';
        
        // Evento click para toggle
        toggleBtn.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '👁️‍🗨️';
                toggleBtn.title = 'Ocultar contraseña';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '👁️';
                toggleBtn.title = 'Mostrar contraseña';
            }
        });
        
        container.appendChild(toggleBtn);
    }

    // Función para mostrar errores
    function showError(input, message) {
        clearMessages(input);
        
        let errorContainer = input.parentElement.querySelector('.password-error');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'password-error';
            errorContainer.style.cssText = `
                color: #dc3545;
                font-size: 12px;
                margin-top: 5px;
                padding: 5px 10px;
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                border-radius: 4px;
                animation: slideDown 0.3s ease-out;
            `;
            input.parentElement.appendChild(errorContainer);
        }
        
        errorContainer.textContent = message;
        input.style.borderColor = '#dc3545';
        
        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        if (!document.head.querySelector('style[data-password-animations]')) {
            style.setAttribute('data-password-animations', 'true');
            document.head.appendChild(style);
        }
    }

    // Función para mostrar éxito
    function showSuccess(input, message) {
        clearMessages(input);
        
        let successContainer = input.parentElement.querySelector('.password-success');
        if (!successContainer) {
            successContainer = document.createElement('div');
            successContainer.className = 'password-success';
            successContainer.style.cssText = `
                color: #155724;
                font-size: 12px;
                margin-top: 5px;
                padding: 5px 10px;
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 4px;
                animation: slideDown 0.3s ease-out;
            `;
            input.parentElement.appendChild(successContainer);
        }
        
        successContainer.textContent = message;
        input.style.borderColor = '#28a745';
    }

    // Función para limpiar mensajes
    function clearMessages(input) {
        const errorContainer = input.parentElement.querySelector('.password-error');
        const successContainer = input.parentElement.querySelector('.password-success');
        const loadingContainer = input.parentElement.querySelector('.password-loading');
        
        if (errorContainer) errorContainer.remove();
        if (successContainer) successContainer.remove();
        if (loadingContainer) loadingContainer.remove();
        
        input.style.borderColor = '';
    }

    // Función para verificar contraseña con el servidor
    async function verifyCurrentPasswordWithServer(password) {
        // Mostrar indicador de carga
        clearMessages(currentPasswordInput);
        
        const loading = document.createElement('div');
        loading.className = 'password-loading';
        loading.style.cssText = `
            color: #6c757d;
            font-size: 12px;
            margin-top: 5px;
            padding: 5px 10px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            animation: slideDown 0.3s ease-out;
        `;
        loading.innerHTML = '⏳ Verificando contraseña...';
        currentPasswordInput.parentElement.appendChild(loading);
        
        try {
            const response = await fetch('/user/verify-current-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword: password })
            });
            
            const data = await response.json();
            
            // Remover indicador de carga
            const loadingContainer = currentPasswordInput.parentElement.querySelector('.password-loading');
            if (loadingContainer) loadingContainer.remove();
            
            if (response.ok && data.success) {
                showSuccess(currentPasswordInput, '✅ Contraseña actual correcta');
                return true;
            } else {
                showError(currentPasswordInput, data.error || '❌ Contraseña actual incorrecta');
                return false;
            }
        } catch (error) {
            console.error('Error al verificar contraseña:', error);
            
            // Remover indicador de carga
            const loadingContainer = currentPasswordInput.parentElement.querySelector('.password-loading');
            if (loadingContainer) loadingContainer.remove();
            
            showError(currentPasswordInput, '⚠️ Error al verificar la contraseña. Inténtalo de nuevo.');
            return false;
        }
    }

    // Función de validación básica
    function validateCurrentPassword() {
        const value = currentPasswordInput.value.trim();
        
        // Validación básica inmediata
        if (!value) {
            showError(currentPasswordInput, 'La contraseña actual es requerida');
            return false;
        }
        
        if (value.length < 6) {
            showError(currentPasswordInput, 'La contraseña debe tener al menos 6 caracteres');
            return false;
        }
        
        return true;
    }

    // Inicializar botón de toggle
    createTogglePasswordButton(currentPasswordInput);

    // Event listeners
    currentPasswordInput.addEventListener('input', function() {
        // Limpiar timeout anterior
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        const value = this.value.trim();
        
        // Validación básica inmediata
        if (!value) {
            clearMessages(this);
            return;
        }
        
        if (value.length < 6) {
            showError(this, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        // Limpiar mensajes mientras escribe
        clearMessages(this);
        
        // Verificación con servidor después de 800ms
        validationTimeout = setTimeout(() => {
            if (value.length >= 6) {
                verifyCurrentPasswordWithServer(value);
            }
        }, 800);
    });

    currentPasswordInput.addEventListener('blur', function() {
        if (validationTimeout) {
            clearTimeout(validationTimeout);
        }
        
        const value = this.value.trim();
        if (value && value.length >= 6) {
            verifyCurrentPasswordWithServer(value);
        }
    });

    // Interceptar envío del formulario para validar
    const profileForm = currentPasswordInput.closest('form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            if (!validateCurrentPassword()) {
                e.preventDefault();
                currentPasswordInput.focus();
                return false;
            }
        });
    }
});