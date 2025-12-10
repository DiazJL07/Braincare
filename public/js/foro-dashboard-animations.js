// Animaciones específicas para Dashboard de Foro

// Función para animar las tarjetas de publicaciones
function animateForumPosts() {
  const posts = document.querySelectorAll('.forum-post-card, .post-item');
  
  posts.forEach((post, index) => {
    post.style.animationDelay = `${index * 0.1}s`;
    post.classList.add('slide-in-left');
    
    // Efectos hover para posts - Animaciones translateX removidas
    post.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
      this.style.boxShadow = '0 8px 25px rgba(74, 144, 226, 0.15)';
      this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    post.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    });
  });
}

// Función para animar estadísticas del foro
function animateForumStats() {
  const statsCards = document.querySelectorAll('.forum-stat-card');
  
  statsCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
    card.classList.add('bounce-in');
    
    // Animación de números específica para foro
    const numberElement = card.querySelector('.stat-number');
    if (numberElement) {
      animateForumCounter(numberElement);
    }
  });
}

// Contador animado específico para estadísticas del foro
function animateForumCounter(element) {
  const target = parseInt(element.textContent);
  const duration = 1500;
  const increment = target / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
  
  // Efecto de pulso al completar
  setTimeout(() => {
    element.style.animation = 'pulse 0.5s ease-in-out';
  }, duration);
}

// Función para animar filtros y categorías
function animateForumFilters() {
  const filters = document.querySelectorAll('.forum-filter, .category-filter');
  
  filters.forEach((filter, index) => {
    filter.style.animationDelay = `${index * 0.05}s`;
    filter.classList.add('fade-in-scale');
    
    // Efectos de selección de filtros
    filter.addEventListener('click', function() {
      // Remover clase activa de otros filtros
      filters.forEach(f => f.classList.remove('filter-active'));
      
      // Añadir clase activa con animación
      this.classList.add('filter-active');
      this.style.animation = 'bounce 0.6s ease-in-out';
      
      setTimeout(() => {
        this.style.animation = '';
      }, 600);
    });
  });
}

// Función para animar la tabla de moderación
function animateModerationTable() {
  const rows = document.querySelectorAll('.moderation-table tbody tr');
  
  rows.forEach((row, index) => {
    row.style.animationDelay = `${index * 0.1}s`;
    row.classList.add('slide-in-right');
    
    // Efectos para acciones de moderación
    const actionButtons = row.querySelectorAll('.moderation-action');
    actionButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.style.animation = 'pulse 0.3s ease-in-out';
        
        // Efecto de confirmación visual
        const originalText = this.textContent;
        this.textContent = '✓';
        this.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
          this.textContent = originalText;
          this.style.backgroundColor = '';
        }, 1000);
      });
    });
  });
}

// Función para animar formularios de creación/edición
function animateForumForms() {
  const formGroups = document.querySelectorAll('.forum-form .form-group');
  
  formGroups.forEach((group, index) => {
    group.style.animationDelay = `${index * 0.1}s`;
    group.classList.add('slide-in-up');
  });
  
  // Efectos para el editor de texto
  const textEditor = document.querySelector('.forum-editor, .post-editor');
  if (textEditor) {
    textEditor.addEventListener('focus', function() {
      this.style.transform = 'scale(1.02)';
      this.style.boxShadow = '0 0 20px rgba(74, 144, 226, 0.3)';
      this.style.transition = 'all 0.3s ease';
    });
    
    textEditor.addEventListener('blur', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '';
    });
  }
}

// Función para animar notificaciones del foro
function animateForumNotifications() {
  const notifications = document.querySelectorAll('.forum-notification');
  
  notifications.forEach((notification, index) => {
    notification.style.animationDelay = `${index * 0.2}s`;
    notification.classList.add('slide-in-right');
    
    // Auto-hide con animación
    setTimeout(() => {
      notification.classList.add('fade-out-right');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000 + (index * 1000));
  });
}

// Función para efectos de búsqueda en tiempo real
function animateForumSearch() {
  const searchInput = document.querySelector('.forum-search-input');
  const searchResults = document.querySelector('.forum-search-results');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      if (searchResults) {
        searchResults.classList.add('search-results-appear');
        
        // Animar resultados individuales
        const results = searchResults.querySelectorAll('.search-result-item');
        results.forEach((result, index) => {
          result.style.animationDelay = `${index * 0.05}s`;
          result.classList.add('fade-in-up');
        });
      }
    });
  }
}

// Función para animar gráficos de actividad del foro
function animateForumCharts() {
  const charts = document.querySelectorAll('.forum-chart, .activity-chart');
  
  charts.forEach(chart => {
    chart.classList.add('chart-fade-in');
    
    // Animar barras de progreso si existen
    const progressBars = chart.querySelectorAll('.progress-bar');
    progressBars.forEach((bar, index) => {
      setTimeout(() => {
        const width = bar.getAttribute('data-width') || '0%';
        bar.style.width = width;
        bar.style.transition = 'width 1s ease-in-out';
      }, index * 200);
    });
  });
}

// Función principal de inicialización para el dashboard del foro
function initForumDashboardAnimations() {
  // Secuencia de animaciones
  setTimeout(() => animateForumStats(), 100);
  setTimeout(() => animateForumPosts(), 300);
  setTimeout(() => animateForumFilters(), 500);
  setTimeout(() => animateModerationTable(), 700);
  setTimeout(() => animateForumForms(), 900);
  setTimeout(() => animateForumNotifications(), 1100);
  setTimeout(() => animateForumSearch(), 1300);
  setTimeout(() => animateForumCharts(), 1500);
}

// Función para efectos de interacción específicos del foro
function initForumInteractions() {
  // Efectos para botones de like/dislike
  const likeButtons = document.querySelectorAll('.like-button, .dislike-button');
  likeButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.style.animation = 'bounce 0.6s ease-in-out';
      
      // Efecto de partículas (simulado con elementos)
      for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.className = 'like-particle';
        particle.style.left = Math.random() * 20 + 'px';
        particle.style.top = Math.random() * 20 + 'px';
        this.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
      }
    });
  });
  
  // Efectos para botones de respuesta
  const replyButtons = document.querySelectorAll('.reply-button');
  replyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const replyForm = this.nextElementSibling;
      if (replyForm && replyForm.classList.contains('reply-form')) {
        replyForm.classList.add('reply-form-appear');
      }
    });
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initForumDashboardAnimations();
  initForumInteractions();
});

// Exportar funciones para uso externo
window.ForumDashboardAnimations = {
  animateForumPosts,
  animateForumStats,
  animateForumFilters,
  animateModerationTable,
  animateForumNotifications
};