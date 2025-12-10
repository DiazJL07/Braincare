// Validador para el formulario de cambio de contraseña
// Valida contraseña actual, nueva contraseña y confirmación

document.addEventListener('DOMContentLoaded', function() {
    const passwordForm = document.querySelector('form[action="/user/change-password"]');
    
    if (!passwordForm) return;
    
    const currentPasswordInput = document.getElementById('currentPasswordChange');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = passwordForm.querySelector('button[type="submit"]');
    
    // Crear botones de mostrar/ocultar contraseña
    function createTogglePasswordButton(input) {
        const container = input.parentElement;
        
        // Verificar si ya existe un botón
        if (container.querySelector('.password-toggle-btn')) return;
        
        // Crear botón
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle-btn';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.style.cssText = `
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 5px;
            z-index: 10;
        `;
        
        // Hacer el contenedor relativo si no lo es
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        // Agregar padding derecho al input para el botón
        input.style.paddingRight = '40px';
        
        // Funcionalidad del botón
        toggleBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
                this.title = 'Ocultar contraseña';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
                this.title = 'Mostrar contraseña';
            }
        });
        
        toggleBtn.title = 'Mostrar contraseña';
        container.appendChild(toggleBtn);
    }
    
    // Crear botones para todos los campos de contraseña
    createTogglePasswordButton(currentPasswordInput);
    createTogglePasswordButton(newPasswordInput);
    createTogglePasswordButton(confirmPasswordInput);
    
    // Estado de validación
    let validationState = {
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    };
    
    // Crear contenedores de mensajes de error si no existen
    function createErrorContainer(input) {
        let errorContainer = input.parentElement.querySelector('.password-error');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'password-error';
            errorContainer.style.cssText = `
                color: #dc3545;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: none;
            `;
            input.parentElement.appendChild(errorContainer);
        }
        return errorContainer;
    }
    
    // Crear contenedores de éxito
    function createSuccessContainer(input) {
        let successContainer = input.parentElement.querySelector('.password-success');
        if (!successContainer) {
            successContainer = document.createElement('div');
            successContainer.className = 'password-success';
            successContainer.style.cssText = `
                color: #28a745;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: none;
            `;
            input.parentElement.appendChild(successContainer);
        }
        return successContainer;
    }
    
    // Mostrar mensaje de error
    function showError(input, message) {
        const errorContainer = createErrorContainer(input);
        const successContainer = input.parentElement.querySelector('.password-success');
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        if (successContainer) {
            successContainer.style.display = 'none';
        }
        
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
    }
    
    // Mostrar mensaje de éxito
    function showSuccess(input, message) {
        const successContainer = createSuccessContainer(input);
        const errorContainer = input.parentElement.querySelector('.password-error');
        
        successContainer.textContent = message;
        successContainer.style.display = 'block';
        
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
        
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
    }
    
    // Limpiar mensajes
    function clearMessages(input) {
        const errorContainer = input.parentElement.querySelector('.password-error');
        const successContainer = input.parentElement.querySelector('.password-success');
        
        if (errorContainer) errorContainer.style.display = 'none';
        if (successContainer) successContainer.style.display = 'none';
        
        input.classList.remove('is-invalid', 'is-valid');
    }
    
    // Validar contraseña actual
    function validateCurrentPassword() {
        const value = currentPasswordInput.value.trim();
        
        if (!value) {
            showError(currentPasswordInput, 'La contraseña actual es requerida');
            validationState.currentPassword = false;
            return false;
        }
        
        if (value.length < 6) {
            showError(currentPasswordInput, 'La contraseña debe tener al menos 6 caracteres');
            validationState.currentPassword = false;
            return false;
        }
        
        // Verificar contra la base de datos
        verifyCurrentPasswordWithServer(value);
        return true; // Retornamos true temporalmente, la verificación real es asíncrona
    }
    
    // Verificar contraseña actual contra el servidor
    function verifyCurrentPasswordWithServer(password) {
        // Mostrar indicador de verificación
        const loadingContainer = currentPasswordInput.parentElement.querySelector('.password-loading');
        if (!loadingContainer) {
            const loading = document.createElement('div');
            loading.className = 'password-loading';
            loading.style.cssText = `
                color: #007bff;
                font-size: 0.875rem;
                margin-top: 0.25rem;
                display: flex;
                align-items: center;
            `;
            loading.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> Verificando contraseña...';
            currentPasswordInput.parentElement.appendChild(loading);
        } else {
            loadingContainer.style.display = 'flex';
        }
        
        // Limpiar mensajes anteriores
        const errorContainer = currentPasswordInput.parentElement.querySelector('.password-error');
        const successContainer = currentPasswordInput.parentElement.querySelector('.password-success');
        if (errorContainer) errorContainer.style.display = 'none';
        if (successContainer) successContainer.style.display = 'none';
        
        // Hacer petición al servidor
        fetch('/user/verify-current-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword: password
            })
        })
        .then(response => response.json())
        .then(data => {
            // Ocultar indicador de carga
            const loadingContainer = currentPasswordInput.parentElement.querySelector('.password-loading');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            
            if (data.success) {
                showSuccess(currentPasswordInput, 'Contraseña actual correcta');
                validationState.currentPassword = true;
            } else {
                showError(currentPasswordInput, data.error || 'Contraseña actual incorrecta');
                validationState.currentPassword = false;
            }
            
            updateSubmitButton();
        })
        .catch(error => {
            console.error('Error al verificar contraseña:', error);
            
            // Ocultar indicador de carga
            const loadingContainer = currentPasswordInput.parentElement.querySelector('.password-loading');
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            
            showError(currentPasswordInput, 'Error al verificar la contraseña. Inténtalo de nuevo.');
            validationState.currentPassword = false;
            updateSubmitButton();
        });
    }
    
    // Validar nueva contraseña
    function validateNewPassword() {
        const value = newPasswordInput.value.trim();
        
        if (!value) {
            showError(newPasswordInput, 'La nueva contraseña es requerida');
            validationState.newPassword = false;
            return false;
        }
        
        if (value.length < 8) {
            showError(newPasswordInput, 'La nueva contraseña debe tener al menos 8 caracteres');
            validationState.newPassword = false;
            return false;
        }
        
        if (value.length > 50) {
            showError(newPasswordInput, 'La contraseña no puede tener más de 50 caracteres');
            validationState.newPassword = false;
            return false;
        }
        
        // Verificar que no sea igual a la contraseña actual
        if (value === currentPasswordInput.value.trim()) {
            showError(newPasswordInput, 'La nueva contraseña debe ser diferente a la actual');
            validationState.newPassword = false;
            return false;
        }
        
        // Validar fortaleza de la contraseña
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        let strengthScore = 0;
        if (hasUpperCase) strengthScore++;
        if (hasLowerCase) strengthScore++;
        if (hasNumbers) strengthScore++;
        if (hasSpecialChar) strengthScore++;
        
        if (strengthScore < 2) {
            showError(newPasswordInput, 'La contraseña debe contener al menos 2 de: mayúsculas, minúsculas, números o símbolos');
            validationState.newPassword = false;
            return false;
        }
        
        showSuccess(newPasswordInput, 'Nueva contraseña válida');
        validationState.newPassword = true;
        
        // Re-validar confirmación si ya tiene valor
        if (confirmPasswordInput.value.trim()) {
            validateConfirmPassword();
        }
        
        return true;
    }
    
    // Validar confirmación de contraseña
    function validateConfirmPassword() {
        const value = confirmPasswordInput.value.trim();
        const newPasswordValue = newPasswordInput.value.trim();
        
        if (!value) {
            showError(confirmPasswordInput, 'Debes confirmar la nueva contraseña');
            validationState.confirmPassword = false;
            return false;
        }
        
        if (value !== newPasswordValue) {
            showError(confirmPasswordInput, 'Las contraseñas no coinciden');
            validationState.confirmPassword = false;
            return false;
        }
        
        showSuccess(confirmPasswordInput, 'Las contraseñas coinciden');
        validationState.confirmPassword = true;
        return true;
    }
    
    // Actualizar estado del botón de envío
    function updateSubmitButton() {
        const isFormValid = validationState.currentPassword && 
                           validationState.newPassword && 
                           validationState.confirmPassword;
        
        if (isFormValid) {
            submitButton.disabled = false;
            submitButton.classList.remove('btn-disabled');
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
        } else {
            submitButton.disabled = true;
            submitButton.classList.add('btn-disabled');
            submitButton.style.opacity = '0.6';
            submitButton.style.cursor = 'not-allowed';
        }
    }
    
    // Event listeners para validación en tiempo real
    currentPasswordInput.addEventListener('input', function() {
        clearTimeout(this.validationTimeout);
        
        // Validación básica inmediata
        const value = this.value.trim();
        if (!value) {
            showError(this, 'La contraseña actual es requerida');
            validationState.currentPassword = false;
            updateSubmitButton();
            return;
        }
        
        if (value.length < 6) {
            showError(this, 'La contraseña debe tener al menos 6 caracteres');
            validationState.currentPassword = false;
            updateSubmitButton();
            return;
        }
        
        // Limpiar mensajes mientras escribe
        clearMessages(this);
        
        // Verificación con servidor con debounce más largo
        this.validationTimeout = setTimeout(() => {
            validateCurrentPassword();
        }, 800); // 800ms para evitar demasiadas peticiones
    });
    
    currentPasswordInput.addEventListener('blur', function() {
        clearTimeout(this.validationTimeout);
        validateCurrentPassword();
    });
    
    newPasswordInput.addEventListener('input', function() {
        clearTimeout(this.validationTimeout);
        this.validationTimeout = setTimeout(() => {
            validateNewPassword();
            updateSubmitButton();
        }, 300);
    });
    
    newPasswordInput.addEventListener('blur', function() {
        validateNewPassword();
        updateSubmitButton();
    });
    
    confirmPasswordInput.addEventListener('input', function() {
        clearTimeout(this.validationTimeout);
        this.validationTimeout = setTimeout(() => {
            validateConfirmPassword();
            updateSubmitButton();
        }, 300);
    });
    
    confirmPasswordInput.addEventListener('blur', function() {
        validateConfirmPassword();
        updateSubmitButton();
    });
    
    // Validación al enviar el formulario
    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar todos los campos
        const isCurrentPasswordValid = validateCurrentPassword();
        const isNewPasswordValid = validateNewPassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        
        if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
            // Mostrar alerta general
            showAlert('Por favor, corrige los errores antes de continuar', 'error');
            return;
        }
        
        // Mostrar indicador de carga
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando contraseña...';
        submitButton.disabled = true;
        
        // Enviar formulario
        fetch('/user/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                currentPassword: currentPasswordInput.value,
                newPassword: newPasswordInput.value,
                confirmPassword: confirmPasswordInput.value
            })
        })
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('Error en la respuesta del servidor');
        })
        .then(html => {
            // Verificar si hay errores en la respuesta
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const errorElement = tempDiv.querySelector('.alert-danger, .error');
            
            if (errorElement) {
                const errorMessage = errorElement.textContent.trim();
                if (errorMessage.includes('Contraseña actual incorrecta')) {
                    showError(currentPasswordInput, 'La contraseña actual es incorrecta');
                    showAlert('La contraseña actual que ingresaste es incorrecta', 'error');
                } else {
                    showAlert(errorMessage, 'error');
                }
            } else {
                // Éxito
                showAlert('Contraseña cambiada exitosamente', 'success');
                passwordForm.reset();
                clearMessages(currentPasswordInput);
                clearMessages(newPasswordInput);
                clearMessages(confirmPasswordInput);
                validationState = {
                    currentPassword: false,
                    newPassword: false,
                    confirmPassword: false
                };
                updateSubmitButton();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('Error al cambiar la contraseña. Inténtalo de nuevo.', 'error');
        })
        .finally(() => {
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        });
    });
    
    // Función para mostrar alertas
    function showAlert(message, type = 'info') {
        // Remover alertas existentes
        const existingAlerts = document.querySelectorAll('.password-alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Crear nueva alerta
        const alert = document.createElement('div');
        alert.className = `password-alert alert alert-${type === 'error' ? 'danger' : type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 500px;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 0.3s ease-out;
        `;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        alert.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas ${icon}" style="margin-right: 10px; font-size: 1.2em;"></i>
                <span>${message}</span>
                <button type="button" style="background: none; border: none; font-size: 1.5em; margin-left: auto; cursor: pointer; opacity: 0.7;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alert.parentElement) {
                alert.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
    
    // Agregar estilos CSS para las animaciones
    if (!document.querySelector('#password-validator-styles')) {
        const styles = document.createElement('style');
        styles.id = 'password-validator-styles';
        styles.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .profile-form-control.is-valid {
                border-color: #28a745;
                box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
            }
            
            .profile-form-control.is-invalid {
                border-color: #dc3545;
                box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
            }
            
            .btn-disabled {
                opacity: 0.6 !important;
                cursor: not-allowed !important;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Inicializar estado del botón
    updateSubmitButton();
});