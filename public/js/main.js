// Función nativa para mostrar mensajes de alerta (sin Bootstrap)
function showAlert(message, type = 'info') {
  const alertPlaceholder = document.getElementById('alertPlaceholder');
  if (!alertPlaceholder) {
    // Crear contenedor si no existe
    const container = document.createElement('div');
    container.id = 'alertPlaceholder';
    container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    document.body.appendChild(container);
  }

  const wrapper = document.createElement('div');
  wrapper.className = `native-alert native-alert-${type}`;
  wrapper.style.cssText = `
    padding: 15px 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideInRight 0.3s ease;
    background: ${getAlertColor(type)};
    color: white;
    font-weight: 500;
  `;
  
  wrapper.innerHTML = `
    <div>${message}</div>
    <button type="button" class="native-alert-close" style="
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin-left: 15px;
      opacity: 0.8;
    " onclick="this.parentElement.remove()">&times;</button>
  `;

  (document.getElementById('alertPlaceholder') || document.body).appendChild(wrapper);

  // Auto-cerrar después de 5 segundos
  setTimeout(() => {
    if (wrapper.parentNode) {
      wrapper.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => wrapper.remove(), 300);
    }
  }, 5000);
}

function getAlertColor(type) {
  const colors = {
    'success': '#28a745',
    'danger': '#dc3545',
    'warning': '#ffc107',
    'info': '#17a2b8',
    'primary': '#007bff'
  };
  return colors[type] || colors.info;
}

// Validación nativa de formularios (sin Bootstrap)
document.addEventListener('DOMContentLoaded', function() {
  // Obtener todos los formularios que necesitan validación
  const forms = document.querySelectorAll('.needs-validation, form[data-validate]');

  // Aplicar validación nativa a cada formulario
  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
        
        // Mostrar errores de validación nativos
        const invalidFields = form.querySelectorAll(':invalid');
        invalidFields.forEach(field => {
          field.style.borderColor = '#dc3545';
          field.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
          
          // Crear mensaje de error si no existe
          let errorMsg = field.parentNode.querySelector('.error-message');
          if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.style.cssText = 'color: #dc3545; font-size: 0.875em; margin-top: 0.25rem;';
            field.parentNode.appendChild(errorMsg);
          }
          errorMsg.textContent = field.validationMessage;
        });
      } else {
        // Limpiar errores si la validación es exitosa
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
          field.style.borderColor = '';
          field.style.boxShadow = '';
          const errorMsg = field.parentNode.querySelector('.error-message');
          if (errorMsg) errorMsg.remove();
        });
      }

      form.classList.add('was-validated');
    }, false);
    
    // Limpiar errores en tiempo real
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('input', function() {
        if (this.checkValidity()) {
          this.style.borderColor = '';
          this.style.boxShadow = '';
          const errorMsg = this.parentNode.querySelector('.error-message');
          if (errorMsg) errorMsg.remove();
        }
      });
    });
  });

  try {
    // Inicializar componentes nativos
    initializeNativeComponents();
    console.log('Componentes nativos inicializados correctamente');
  } catch (error) {
    console.error('Error al inicializar componentes:', error);
  }
});

// Función para inicializar componentes nativos
function initializeNativeComponents() {
  // Inicializar dropdowns nativos
  const dropdowns = document.querySelectorAll('[data-toggle="dropdown"]');
  dropdowns.forEach(dropdown => {
    dropdown.addEventListener('click', function(e) {
      e.preventDefault();
      const menu = this.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        menu.classList.toggle('show');
      }
    });
  });
  
  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!e.target.closest('[data-toggle="dropdown"]')) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });
}

// Confirmar eliminación
function confirmDelete(userId, name) {
  document.getElementById('userName').textContent = name;
  document.getElementById('deleteForm').action = `/admin/users/${userId}/delete`;
  
  // Mostrar modal sin Bootstrap
  const deleteModal = document.getElementById('deleteModal');
  if (deleteModal) {
    deleteModal.style.display = 'block';
    deleteModal.classList.add('show');
  }
}

// Confirmar eliminación de artículo
function confirmDeleteArticle(articleId, articleTitle) {
    console.log('confirmDeleteArticle llamado con ID:', articleId, 'y Título:', articleTitle);
    const deleteModal = document.getElementById('deleteArticleModal');
    const articleTitleSpan = document.getElementById('articleTitle');
    const deleteForm = document.getElementById('deleteArticleForm');

    if (articleTitleSpan) {
        articleTitleSpan.textContent = articleTitle;
    }
    if (deleteForm) {
        deleteForm.action = `/articles/admin/${articleId}/delete`;
    }
    if (deleteModal) {
        deleteModal.style.display = 'block';
        deleteModal.classList.add('show');
    }
}