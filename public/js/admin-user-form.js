// JavaScript para el formulario de creación/edición de usuarios - Admin
// Mejora la experiencia del usuario con validaciones y efectos interactivos

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('userForm');
    const submitBtn = document.getElementById('submitBtn');
    const inputs = form.querySelectorAll('input, select');
    
    // Configuración de validaciones mejoradas
    const validationRules = {
        name: {
            required: true,
            minLength: 2,
            maxLength: 50,
            pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_\.@#$%&*+!?]+$/,
            message: 'El nombre puede contener letras, números, espacios y símbolos (2-50 caracteres)'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Ingresa una dirección de correo electrónico válida'
        },
        password: {
            required: true,
            minLength: 6,
            maxLength: 100,
            pattern: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_\.@#$%&*+!?]+$/,
            message: 'La contraseña puede contener letras, números y símbolos (6-100 caracteres)'
        },
        role: {
            required: true,
            message: 'Selecciona un rol para el usuario'
        }
    };
    
    // Función para mostrar mensajes de validación
    function showValidationMessage(input, message, isValid = false) {
        const formGroup = input.closest('.form-group');
        let messageElement = formGroup.querySelector('.validation-message');
        
        // Remover mensaje anterior si existe
        if (messageElement) {
            messageElement.remove();
        }
        
        // Crear nuevo mensaje
        if (message) {
            messageElement = document.createElement('div');
            messageElement.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
            messageElement.innerHTML = `
                <i class="fas ${isValid ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            `;
            
            const formText = formGroup.querySelector('.form-text');
            if (formText) {
                formText.after(messageElement);
            } else {
                formGroup.appendChild(messageElement);
            }
            
            // Animación de entrada
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 10);
        }
        
        // Actualizar clases del input
        input.classList.remove('is-valid', 'is-invalid');
        if (message) {
            input.classList.add(isValid ? 'is-valid' : 'is-invalid');
        }
    }
    
    // Función de validación individual
    function validateField(input) {
        const fieldName = input.name;
        const value = input.value.trim();
        const rules = validationRules[fieldName];
        
        if (!rules) return true;
        
        // Validar campo requerido
        if (rules.required && !value) {
            showValidationMessage(input, `Este campo es obligatorio`);
            return false;
        }
        
        // Si el campo está vacío y no es requerido, es válido
        if (!value && !rules.required) {
            showValidationMessage(input, null);
            return true;
        }
        
        // Validar longitud mínima
        if (rules.minLength && value.length < rules.minLength) {
            showValidationMessage(input, rules.message);
            return false;
        }
        
        // Validar longitud máxima
        if (rules.maxLength && value.length > rules.maxLength) {
            showValidationMessage(input, rules.message);
            return false;
        }
        
        // Validar patrón
        if (rules.pattern && !rules.pattern.test(value)) {
            showValidationMessage(input, rules.message);
            return false;
        }
        
        // Campo válido
        showValidationMessage(input, '¡Perfecto!', true);
        return true;
    }
    
    // Función para validar todo el formulario
    function validateForm() {
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    // Función para actualizar el estado del botón
    function updateSubmitButton() {
        const isFormValid = validateForm();
        submitBtn.disabled = !isFormValid;
        
        if (isFormValid) {
            submitBtn.classList.add('ready');
            submitBtn.classList.remove('disabled');
        } else {
            submitBtn.classList.remove('ready');
            submitBtn.classList.add('disabled');
        }
    }
    
    // Event listeners para validación en tiempo real
    inputs.forEach(input => {
        // Validación al perder el foco
        input.addEventListener('blur', function() {
            validateField(this);
            updateSubmitButton();
        });
        
        // Validación mientras se escribe (con debounce)
        let timeout;
        input.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                validateField(this);
                updateSubmitButton();
            }, 500);
        });
        
        // Efectos visuales al enfocar
        input.addEventListener('focus', function() {
            this.closest('.form-group').classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.closest('.form-group').classList.remove('focused');
        });
    });
    
    // Manejo del envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar todo el formulario
        if (!validateForm()) {
            // Enfocar el primer campo inválido
            const firstInvalid = form.querySelector('.is-invalid');
            if (firstInvalid) {
                firstInvalid.focus();
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        // Mostrar estado de carga
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Procesando...
        `;
        
        // Simular delay para mejor UX
        setTimeout(() => {
            // Enviar formulario
            const formData = new FormData(form);
            const method = form.querySelector('input[name="_method"]') ? 'PUT' : 'POST';
            
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (response.ok) {
                    // Éxito
                    submitBtn.innerHTML = `
                        <i class="fas fa-check"></i>
                        ¡Completado!
                    `;
                    submitBtn.classList.remove('loading');
                    submitBtn.classList.add('success');
                    
                    // Redirigir después de un momento
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard';
                    }, 1500);
                } else {
                    throw new Error('Error en el servidor');
                }
            })
            .catch(error => {
                // Error
                submitBtn.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    Error - Intentar de nuevo
                `;
                submitBtn.classList.remove('loading');
                submitBtn.classList.add('error');
                submitBtn.disabled = false;
                
                // Restaurar botón después de un momento
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('error');
                }, 3000);
                
                console.error('Error:', error);
            });
        }, 800);
    });
    
    // Función para mostrar/ocultar contraseña
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        
        const inputGroup = passwordInput.closest('.input-group');
        inputGroup.appendChild(toggleButton);
        
        toggleButton.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    }
    
    // Función para autocompletar sugerencias de email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        const commonDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'empresa.com'];
        
        emailInput.addEventListener('input', function() {
            const value = this.value;
            const atIndex = value.indexOf('@');
            
            if (atIndex > 0 && atIndex === value.length - 1) {
                // Usuario acaba de escribir @
                const suggestions = document.createElement('div');
                suggestions.className = 'email-suggestions';
                
                commonDomains.forEach(domain => {
                    const suggestion = document.createElement('div');
                    suggestion.className = 'email-suggestion';
                    suggestion.textContent = value + domain;
                    suggestion.addEventListener('click', function() {
                        emailInput.value = this.textContent;
                        suggestions.remove();
                        validateField(emailInput);
                    });
                    suggestions.appendChild(suggestion);
                });
                
                // Remover sugerencias anteriores
                const existingSuggestions = document.querySelector('.email-suggestions');
                if (existingSuggestions) {
                    existingSuggestions.remove();
                }
                
                emailInput.parentNode.appendChild(suggestions);
                
                // Remover sugerencias al hacer clic fuera
                setTimeout(() => {
                    document.addEventListener('click', function removeSuggestions(e) {
                        if (!suggestions.contains(e.target) && e.target !== emailInput) {
                            suggestions.remove();
                            document.removeEventListener('click', removeSuggestions);
                        }
                    });
                }, 100);
            }
        });
    }
    
    // Inicializar validación del formulario
    updateSubmitButton();
    
    // Animaciones de entrada para los elementos del formulario
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach((group, index) => {
        group.style.opacity = '0';
        group.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            group.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            group.style.opacity = '1';
            group.style.transform = 'translateY(0)';
        }, 100 * (index + 1));
    });
});

// Estilos CSS adicionales para las validaciones y efectos
const additionalStyles = `
<style>
.validation-message {
    margin-top: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.validation-message.invalid {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    color: #dc2626;
    border-left: 3px solid #dc2626;
}

.validation-message.valid {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    color: #16a34a;
    border-left: 3px solid #16a34a;
}

.form-control.is-invalid {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.form-control.is-valid {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.form-group.focused {
    transform: scale(1.02);
    z-index: 10;
    position: relative;
}

.btn-primary.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
}

.btn-primary.ready {
    animation: pulseReady 2s infinite;
}

.btn-primary.success {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
}

.btn-primary.error {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
}

@keyframes pulseReady {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
    }
    50% {
        box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
    }
}

.password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    z-index: 3;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.password-toggle:hover {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
}

.email-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
}

.email-suggestion {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f3f4f6;
}

.email-suggestion:hover {
    background: #f9fafb;
}

.email-suggestion:last-child {
    border-bottom: none;
}
</style>
`;

// Agregar estilos al head
document.head.insertAdjacentHTML('beforeend', additionalStyles);