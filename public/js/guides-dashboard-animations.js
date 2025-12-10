// Animaciones específicas para Dashboard de Guías

// Función para animar las tarjetas de guías
function animateGuidesCards() {
  const guides = document.querySelectorAll('.guide-card, .guide-item');
  
  guides.forEach((guide, index) => {
    guide.style.animationDelay = `${index * 0.15}s`;
    guide.classList.add('fade-in-scale');
    
    // Efectos hover específicos para guías
    guide.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-10px) scale(1.03)';
      this.style.boxShadow = '0 15px 40px rgba(16, 185, 129, 0.2)';
      this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Animar icono de la guía
      const icon = this.querySelector('.guide-icon');
      if (icon) {
        icon.style.transform = 'scale(1.2) rotate(10deg)';
        icon.style.transition = 'all 0.3s ease';
      }
    });
    
    guide.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      
      const icon = this.querySelector('.guide-icon');
      if (icon) {
        icon.style.transform = 'scale(1) rotate(0deg)';
      }
    });
  });
}

// Función para animar estadísticas de guías
function animateGuidesStats() {
  const statsCards = document.querySelectorAll('.guides-stat-card');
  
  statsCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
    card.classList.add('slide-in-bottom');
    
    // Animación de progreso para estadísticas
    const progressElement = card.querySelector('.stat-progress');
    if (progressElement) {
      setTimeout(() => {
        const targetWidth = progressElement.getAttribute('data-progress') || '0%';
        progressElement.style.width = targetWidth;
        progressElement.style.transition = 'width 1.5s ease-in-out';
      }, 500 + (index * 200));
    }
    
    // Contador animado para números
    const numberElement = card.querySelector('.stat-number');
    if (numberElement) {
      animateGuidesCounter(numberElement, index * 200);
    }
  });
}

// Contador específico para estadísticas de guías
function animateGuidesCounter(element, delay = 0) {
  setTimeout(() => {
    const target = parseInt(element.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        
        // Efecto de celebración al completar
        element.style.animation = 'pulse 0.5s ease-in-out';
      }
      element.textContent = Math.floor(current);
    }, 16);
  }, delay);
}

// Función para animar categorías de guías
function animateGuidesCategories() {
  const categories = document.querySelectorAll('.guide-category, .category-tab');
  
  categories.forEach((category, index) => {
    category.style.animationDelay = `${index * 0.1}s`;
    category.classList.add('slide-in-top');
    
    // Efectos de selección de categoría
    category.addEventListener('click', function() {
      // Remover clase activa de otras categorías
      categories.forEach(cat => {
        cat.classList.remove('category-active');
        cat.style.transform = 'scale(1)';
      });
      
      // Activar categoría seleccionada
      this.classList.add('category-active');
      this.style.transform = 'scale(1.05)';
      this.style.animation = 'bounce 0.6s ease-in-out';
      
      // Animar contenido relacionado
      animateRelatedGuides();
    });
  });
}

// Función para animar guías relacionadas
function animateRelatedGuides() {
  const relatedGuides = document.querySelectorAll('.related-guide');
  
  relatedGuides.forEach((guide, index) => {
    guide.style.opacity = '0';
    guide.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      guide.style.opacity = '1';
      guide.style.transform = 'translateY(0)';
      guide.style.transition = 'all 0.4s ease-out';
    }, index * 100);
  });
}

// Función para animar formularios de guías
function animateGuidesForm() {
  const formSections = document.querySelectorAll('.guide-form-section');
  
  formSections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.15}s`;
    section.classList.add('slide-in-left');
  });
  
  // Efectos para el editor de contenido
  const contentEditor = document.querySelector('.guide-content-editor');
  if (contentEditor) {
    contentEditor.addEventListener('focus', function() {
      this.style.transform = 'scale(1.01)';
      this.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.3)';
      this.style.transition = 'all 0.3s ease';
    });
    
    contentEditor.addEventListener('blur', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '';
    });
  }
  
  // Efectos para subida de imágenes
  const imageUpload = document.querySelector('.guide-image-upload');
  if (imageUpload) {
    imageUpload.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
      this.style.borderColor = '#10b981';
      this.style.transform = 'scale(1.02)';
    });
    
    imageUpload.addEventListener('dragleave', function() {
      this.style.backgroundColor = '';
      this.style.borderColor = '';
      this.style.transform = 'scale(1)';
    });
  }
}

// Función para animar la tabla de gestión de guías
function animateGuidesTable() {
  const rows = document.querySelectorAll('.guides-table tbody tr');
  
  rows.forEach((row, index) => {
    row.style.animationDelay = `${index * 0.08}s`;
    row.classList.add('fade-in-right');
    
    // Efectos para acciones de la tabla
    const actionButtons = row.querySelectorAll('.guide-action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.style.animation = 'pulse 0.3s ease-in-out';
        
        // Efecto de confirmación visual
        if (this.classList.contains('delete-btn')) {
          this.style.backgroundColor = '#ef4444';
          this.innerHTML = '<i class="fas fa-check"></i>';
          
          setTimeout(() => {
            this.style.backgroundColor = '';
            this.innerHTML = '<i class="fas fa-trash"></i>';
          }, 1500);
        }
      });
    });
  });
}

// Función para animar búsqueda de guías
function animateGuidesSearch() {
  const searchInput = document.querySelector('.guides-search-input');
  const searchResults = document.querySelector('.guides-search-results');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const query = this.value;
      
      if (query.length > 2) {
        if (searchResults) {
          searchResults.classList.add('search-results-show');
          
          // Animar resultados
          const results = searchResults.querySelectorAll('.search-result');
          results.forEach((result, index) => {
            result.style.animationDelay = `${index * 0.05}s`;
            result.classList.add('search-result-appear');
          });
        }
      } else {
        if (searchResults) {
          searchResults.classList.remove('search-results-show');
        }
      }
    });
  }
}

// Función para animar filtros avanzados
function animateGuidesFilters() {
  const filterToggle = document.querySelector('.guides-filter-toggle');
  const filterPanel = document.querySelector('.guides-filter-panel');
  
  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', function() {
      if (filterPanel.classList.contains('filter-panel-open')) {
        filterPanel.classList.remove('filter-panel-open');
        filterPanel.classList.add('filter-panel-close');
      } else {
        filterPanel.classList.add('filter-panel-open');
        filterPanel.classList.remove('filter-panel-close');
        
        // Animar elementos del filtro
        const filterItems = filterPanel.querySelectorAll('.filter-item');
        filterItems.forEach((item, index) => {
          item.style.animationDelay = `${index * 0.1}s`;
          item.classList.add('filter-item-appear');
        });
      }
    });
  }
}

// Función para animar progreso de lectura
function animateReadingProgress() {
  const progressBars = document.querySelectorAll('.reading-progress');
  
  progressBars.forEach(bar => {
    const progress = bar.getAttribute('data-progress') || '0';
    const progressValue = parseInt(progress);
    
    // Animar barra de progreso
    setTimeout(() => {
      bar.style.width = progress + '%';
      bar.style.transition = 'width 1s ease-in-out';
      
      // Cambiar color según el progreso
      if (progressValue < 30) {
        bar.style.backgroundColor = '#ef4444';
      } else if (progressValue < 70) {
        bar.style.backgroundColor = '#f59e0b';
      } else {
        bar.style.backgroundColor = '#10b981';
      }
    }, 500);
  });
}

// Función principal de inicialización
function initGuidesDashboardAnimations() {
  // Secuencia de animaciones
  setTimeout(() => animateGuidesStats(), 100);
  setTimeout(() => animateGuidesCategories(), 300);
  setTimeout(() => animateGuidesCards(), 500);
  setTimeout(() => animateGuidesTable(), 700);
  setTimeout(() => animateGuidesForm(), 900);
  setTimeout(() => animateGuidesSearch(), 1100);
  setTimeout(() => animateGuidesFilters(), 1300);
  setTimeout(() => animateReadingProgress(), 1500);
}

// Función para efectos de interacción específicos
function initGuidesInteractions() {
  // Efectos para botones de favoritos
  const favoriteButtons = document.querySelectorAll('.favorite-btn');
  favoriteButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.classList.toggle('favorited');
      this.style.animation = 'bounce 0.6s ease-in-out';
      
      // Efecto de corazón
      const heart = document.createElement('div');
      heart.innerHTML = '❤️';
      heart.className = 'floating-heart';
      this.appendChild(heart);
      
      setTimeout(() => heart.remove(), 1000);
    });
  });
  
  // Efectos para compartir guías
  const shareButtons = document.querySelectorAll('.share-btn');
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.style.animation = 'pulse 0.3s ease-in-out';
      
      // Mostrar opciones de compartir
      const shareOptions = this.nextElementSibling;
      if (shareOptions && shareOptions.classList.contains('share-options')) {
        shareOptions.classList.add('share-options-show');
      }
    });
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initGuidesDashboardAnimations();
  initGuidesInteractions();
});

// Exportar funciones para uso externo
window.GuidesDashboardAnimations = {
  animateGuidesCards,
  animateGuidesStats,
  animateGuidesCategories,
  animateGuidesTable,
  animateReadingProgress
};