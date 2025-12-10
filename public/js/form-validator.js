/**
 * Sistema de Validación y Guardado Automático para Formularios
 * Valida campos input y select en tiempo real y guarda automáticamente los cambios
 */

if (typeof FormValidator === 'undefined') {
class FormValidator {
    constructor(options = {}) {
        this.options = {
            autoSave: true,
            autoSaveDelay: 2000, // 2 segundos después del último cambio
            showValidationMessages: true,
            validateOnInput: true,
            validateOnBlur: true,
            saveEndpoint: '/api/auto-save',
            ...options
        };
        
        this.forms = new Map();
        this.autoSaveTimeouts = new Map();
        this.validationRules = new Map();
        
        this.init();
    }
    
    init() {
        // Buscar todos los formularios con atributo data-validate
        const forms = document.querySelectorAll('form[data-validate], .needs-validation');
        forms.forEach(form => this.initializeForm(form));
        
        // Observar nuevos formularios que se agreguen dinámicamente
        this.observeNewForms();
    }
    
    initializeForm(form) {
        const formId = form.id || `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!form.id) form.id = formId;
        
        const formData = {
            element: form,
            fields: new Map(),
            isValid: false,
            hasChanges: false,
            lastSaved: null
        };
        
        this.forms.set(formId, formData);
        this.setupFormFields(form, formData);
        this.createStatusIndicator(form);
        
        console.log(`Formulario inicializado: ${formId}`);
    }
    
    setupFormFields(form, formData) {
        const fields = form.querySelectorAll('input, select, textarea');
        
        fields.forEach(field => {
            if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button') {
                return;
            }
            
            const fieldData = {
                element: field,
                isValid: true,
                originalValue: field.value,
                currentValue: field.value,
                rules: this.getValidationRules(field)
            };
            
            formData.fields.set(field.name || field.id, fieldData);
            this.setupFieldEvents(field, formData);
        });
    }
    
    getValidationRules(field) {
        const rules = {};
        
        // Reglas básicas basadas en atributos HTML
        if (field.required) rules.required = true;
        if (field.minLength) rules.minLength = field.minLength;
        if (field.maxLength) rules.maxLength = field.maxLength;
        if (field.min) rules.min = field.min;
        if (field.max) rules.max = field.max;
        if (field.pattern) rules.pattern = new RegExp(field.pattern);
        
        // Reglas específicas por tipo
        switch (field.type) {
            case 'email':
                rules.email = true;
                break;
            case 'url':
                rules.url = true;
                break;
            case 'number':
                rules.number = true;
                break;
            case 'tel':
                rules.phone = true;
                break;
        }
        
        // Reglas personalizadas desde atributos data-*
        if (field.dataset.validate) {
            try {
                const customRules = JSON.parse(field.dataset.validate);
                Object.assign(rules, customRules);
            } catch (e) {
                console.warn('Error parsing custom validation rules:', e);
            }
        }
        
        return rules;
    }
    
    setupFieldEvents(field, formData) {
        // Validación en tiempo real mientras se escribe
        if (this.options.validateOnInput) {
            let inputTimeout;
            field.addEventListener('input', () => {
                clearTimeout(inputTimeout);
                inputTimeout = setTimeout(() => {
                    this.validateField(field, formData);
                    this.checkForChanges(formData);
                }, 300);
            });
        }
        
        // Validación al perder el foco
        if (this.options.validateOnBlur) {
            field.addEventListener('blur', () => {
                this.validateField(field, formData);
                this.checkForChanges(formData);
            });
        }
        
        // Efectos visuales
        field.addEventListener('focus', () => {
            field.closest('.form-group, .mb-3, .form-field')?.classList.add('focused');
        });
        
        field.addEventListener('blur', () => {
            field.closest('.form-group, .mb-3, .form-field')?.classList.remove('focused');
        });
    }
    
    validateField(field, formData) {
        const fieldData = formData.fields.get(field.name || field.id);
        if (!fieldData) return true;
        
        const value = field.value.trim();
        const rules = fieldData.rules;
        let isValid = true;
        let message = '';
        
        // Validar campo requerido
        if (rules.required && !value) {
            isValid = false;
            message = 'Este campo es obligatorio';
        }
        
        // Validar longitud mínima
        else if (rules.minLength && value.length < rules.minLength) {
            isValid = false;
            message = `Mínimo ${rules.minLength} caracteres`;
        }
        
        // Validar longitud máxima
        else if (rules.maxLength && value.length > rules.maxLength) {
            isValid = false;
            message = `Máximo ${rules.maxLength} caracteres`;
        }
        
        // Validar email
        else if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            message = 'Formato de email inválido';
        }
        
        // Validar URL
        else if (rules.url && value && !/^https?:\/\/.+/.test(value)) {
            isValid = false;
            message = 'URL inválida';
        }
        
        // Validar número
        else if (rules.number && value && isNaN(value)) {
            isValid = false;
            message = 'Debe ser un número válido';
        }
        
        // Validar rango numérico
        else if (rules.min && parseFloat(value) < rules.min) {
            isValid = false;
            message = `Valor mínimo: ${rules.min}`;
        }
        
        else if (rules.max && parseFloat(value) < rules.max) {
            isValid = false;
            message = `Valor máximo: ${rules.max}`;
        }
        
        // Validar patrón personalizado
        else if (rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            message = 'Formato inválido';
        }
        
        // Validación de contraseñas coincidentes
        else if (field.hasAttribute('data-match') && value) {
            const matchFieldId = field.getAttribute('data-match');
            const matchField = document.getElementById(matchFieldId);
            if (matchField && value !== matchField.value) {
                isValid = false;
                message = 'Las contraseñas no coinciden';
            }
        }
        
        // Actualizar estado del campo
        fieldData.isValid = isValid;
        fieldData.currentValue = value;
        
        // Mostrar/ocultar mensaje de validación
        if (this.options.showValidationMessages) {
            this.showValidationMessage(field, message, isValid);
        }
        
        // Actualizar clases CSS
        field.classList.remove('is-valid', 'is-invalid');
        if (value) { // Solo mostrar estado si hay contenido
            field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        }
        
        // Actualizar estado general del formulario
        this.updateFormStatus(formData);
        
        return isValid;
    }
    
    showValidationMessage(field, message, isValid) {
        const container = field.closest('.form-group, .mb-3, .form-field') || field.parentNode;
        let messageElement = container.querySelector('.validation-feedback');
        
        // Remover mensaje anterior
        if (messageElement) {
            messageElement.remove();
        }
        
        // Crear nuevo mensaje si es necesario
        if (message) {
            messageElement = document.createElement('div');
            messageElement.className = `validation-feedback ${isValid ? 'valid-feedback' : 'invalid-feedback'}`;
            messageElement.innerHTML = `
                <i class="fas ${isValid ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                ${message}
            `;
            
            container.appendChild(messageElement);
            
            // Animación de entrada
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                messageElement.style.transition = 'all 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 10);
        }
    }
    
    checkForChanges(formData) {
        let hasChanges = false;
        
        formData.fields.forEach(fieldData => {
            if (fieldData.currentValue !== fieldData.originalValue) {
                hasChanges = true;
            }
        });
        
        formData.hasChanges = hasChanges;
        this.updateStatusIndicator(formData);
        
        // Programar guardado automático si hay cambios
        if (hasChanges && this.options.autoSave) {
            this.scheduleAutoSave(formData);
        }
    }
    
    updateFormStatus(formData) {
        let isValid = true;
        
        formData.fields.forEach(fieldData => {
            if (!fieldData.isValid) {
                isValid = false;
            }
        });
        
        formData.isValid = isValid;
        this.updateStatusIndicator(formData);
    }
    
    createStatusIndicator(form) {
        const indicator = document.createElement('div');
        indicator.className = 'form-status-indicator';
        indicator.innerHTML = `
            <div class="status-content">
                <i class="status-icon fas fa-circle"></i>
                <span class="status-text">Listo</span>
                <div class="status-spinner" style="display: none;">
                    <i class="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        `;
        
        // Insertar al final del formulario
        form.appendChild(indicator);
    }
    
    updateStatusIndicator(formData) {
        const indicator = formData.element.querySelector('.form-status-indicator');
        if (!indicator) return;
        
        const icon = indicator.querySelector('.status-icon');
        const text = indicator.querySelector('.status-text');
        const spinner = indicator.querySelector('.status-spinner');
        
        // Resetear clases
        indicator.className = 'form-status-indicator';
        
        if (formData.hasChanges) {
            if (formData.isValid) {
                indicator.classList.add('has-changes', 'valid');
                icon.className = 'status-icon fas fa-edit';
                text.textContent = 'Cambios pendientes';
            } else {
                indicator.classList.add('has-changes', 'invalid');
                icon.className = 'status-icon fas fa-exclamation-triangle';
                text.textContent = 'Errores de validación';
            }
        } else {
            indicator.classList.add('saved');
            icon.className = 'status-icon fas fa-check-circle';
            text.textContent = formData.lastSaved ? 'Guardado' : 'Listo';
        }
    }
    
    scheduleAutoSave(formData) {
        const formId = formData.element.id;
        
        // Cancelar guardado anterior si existe
        if (this.autoSaveTimeouts.has(formId)) {
            clearTimeout(this.autoSaveTimeouts.get(formId));
        }
        
        // Programar nuevo guardado
        const timeout = setTimeout(() => {
            this.autoSave(formData);
        }, this.options.autoSaveDelay);
        
        this.autoSaveTimeouts.set(formId, timeout);
    }
    
    async autoSave(formData) {
        if (!formData.isValid || !formData.hasChanges) return;
        
        const indicator = formData.element.querySelector('.form-status-indicator');
        const spinner = indicator?.querySelector('.status-spinner');
        const content = indicator?.querySelector('.status-content');
        
        try {
            // Mostrar spinner
            if (spinner && content) {
                content.style.display = 'none';
                spinner.style.display = 'block';
            }
            
            // Recopilar datos del formulario
            const formDataToSave = new FormData(formData.element);
            const jsonData = {};
            
            formDataToSave.forEach((value, key) => {
                jsonData[key] = value;
            });
            
            // Agregar metadatos
            jsonData._autoSave = true;
            jsonData._formId = formData.element.id;
            jsonData._timestamp = new Date().toISOString();
            
            // Enviar datos al servidor
            const response = await fetch(this.options.saveEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(jsonData)
            });
            
            if (response.ok) {
                // Guardado exitoso
                formData.lastSaved = new Date();
                formData.hasChanges = false;
                
                // Actualizar valores originales
                formData.fields.forEach(fieldData => {
                    fieldData.originalValue = fieldData.currentValue;
                });
                
                this.updateStatusIndicator(formData);
                this.showSaveNotification('Cambios guardados automáticamente', 'success');
            } else {
                throw new Error('Error al guardar');
            }
            
        } catch (error) {
            console.error('Error en guardado automático:', error);
            this.showSaveNotification('Error al guardar cambios', 'error');
        } finally {
            // Ocultar spinner
            if (spinner && content) {
                spinner.style.display = 'none';
                content.style.display = 'block';
            }
        }
    }
    
    showSaveNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `save-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check' : 'fa-exclamation-triangle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        // Animación de entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    observeNewForms() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // Buscar formularios en el nodo agregado
                        const forms = node.matches?.('form[data-validate], .needs-validation') 
                            ? [node] 
                            : node.querySelectorAll?.('form[data-validate], .needs-validation') || [];
                        
                        forms.forEach(form => {
                            if (!this.forms.has(form.id)) {
                                this.initializeForm(form);
                            }
                        });
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Métodos públicos para control manual
    validateForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return false;
        
        let isValid = true;
        formData.fields.forEach(fieldData => {
            if (!this.validateField(fieldData.element, formData)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    saveForm(formId) {
        const formData = this.forms.get(formId);
        if (formData) {
            this.autoSave(formData);
        }
    }
    
    resetForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;
        
        formData.fields.forEach(fieldData => {
            fieldData.element.value = fieldData.originalValue;
            fieldData.currentValue = fieldData.originalValue;
            fieldData.isValid = true;
            
            // Limpiar clases de validación
            fieldData.element.classList.remove('is-valid', 'is-invalid');
            
            // Remover mensajes de validación
            const container = fieldData.element.closest('.form-group, .mb-3, .form-field') || fieldData.element.parentNode;
            const message = container.querySelector('.validation-feedback');
            if (message) message.remove();
        });
        
        formData.hasChanges = false;
        formData.isValid = true;
        this.updateStatusIndicator(formData);
    }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.formValidator = new FormValidator({
        autoSave: true,
        autoSaveDelay: 2000,
        showValidationMessages: true,
        validateOnInput: true,
        validateOnBlur: true
    });
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}

}