// Animaciones específicas para Dashboard de Artículos

// Función para animar las tarjetas de artículos
function animateArticlesCards() {
  const articles = document.querySelectorAll('.article-card, .article-item');
  
  articles.forEach((article, index) => {
    article.style.animationDelay = `${index * 0.12}s`;
    article.classList.add('zoom-in');
    
    // Efectos hover específicos para artículos
    article.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
      this.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.2)';
      this.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Animar imagen del artículo
      const image = this.querySelector('.article-image');
      if (image) {
        image.style.transform = 'scale(1.1)';
        image.style.transition = 'all 0.4s ease';
      }
      
      // Animar título del artículo
      const title = this.querySelector('.article-title');
      if (title) {
        title.style.color = '#8b5cf6';
        title.style.transition = 'color 0.3s ease';
      }
    });
    
    article.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      
      const image = this.querySelector('.article-image');
      if (image) {
        image.style.transform = 'scale(1)';
      }
      
      const title = this.querySelector('.article-title');
      if (title) {
        title.style.color = '';
      }
    });
  });
}

// Función para animar estadísticas de artículos
function animateArticlesStats() {
  const statsCards = document.querySelectorAll('.articles-stat-card');
  
  statsCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.25}s`;
    card.classList.add('flip-in');
    
    // Animación de gráficos circulares
    const circularProgress = card.querySelector('.circular-progress');
    if (circularProgress) {
      setTimeout(() => {
        const percentage = circularProgress.getAttribute('data-percentage') || '0';
        animateCircularProgress(circularProgress, percentage);
      }, 500 + (index * 250));
    }
    
    // Contador animado para números
    const numberElement = card.querySelector('.stat-number');
    if (numberElement) {
      animateArticlesCounter(numberElement, index * 250);
    }
  });
}

// Función para animar progreso circular
function animateCircularProgress(element, percentage) {
  const circle = element.querySelector('.progress-circle');
  if (circle) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;
    circle.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
    
    setTimeout(() => {
      circle.style.strokeDashoffset = offset;
    }, 100);
  }
}

// Contador específico para estadísticas de artículos
function animateArticlesCounter(element, delay = 0) {
  setTimeout(() => {
    const target = parseInt(element.textContent);
    const duration = 2500;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
        
        // Efecto de brillo al completar
        element.style.animation = 'glow 0.8s ease-in-out';
      }
      element.textContent = Math.floor(current);
    }, 16);
  }, delay);
}

// Función para animar categorías de artículos
function animateArticlesCategories() {
  const categories = document.querySelectorAll('.article-category, .category-pill');
  
  categories.forEach((category, index) => {
    category.style.animationDelay = `${index * 0.08}s`;
    category.classList.add('pop-in');
    
    // Efectos de selección de categoría
    category.addEventListener('click', function() {
      // Remover clase activa de otras categorías
      categories.forEach(cat => {
        cat.classList.remove('category-selected');
        cat.style.transform = 'scale(1)';
      });
      
      // Activar categoría seleccionada
      this.classList.add('category-selected');
      this.style.transform = 'scale(1.1)';
      this.style.animation = 'wiggle 0.6s ease-in-out';
      
      // Filtrar artículos con animación
      animateArticlesFilter();
    });
  });
}

// Función para animar filtrado de artículos
function animateArticlesFilter() {
  const articles = document.querySelectorAll('.article-card');
  
  // Fade out todos los artículos
  articles.forEach(article => {
    article.style.opacity = '0.3';
    article.style.transform = 'scale(0.95)';
    article.style.transition = 'all 0.3s ease';
  });
  
  // Fade in artículos filtrados
  setTimeout(() => {
    articles.forEach((article, index) => {
      // Simular filtrado (en implementación real sería basado en categoría)
      if (Math.random() > 0.3) {
        article.style.opacity = '1';
        article.style.transform = 'scale(1)';
        article.style.animationDelay = `${index * 0.1}s`;
      }
    });
  }, 300);
}

// Función para animar editor de artículos
function animateArticlesEditor() {
  const editorSections = document.querySelectorAll('.editor-section');
  
  editorSections.forEach((section, index) => {
    section.style.animationDelay = `${index * 0.2}s`;
    section.classList.add('slide-in-bottom');
  });
  
  // Efectos para el editor de texto enriquecido
  const richEditor = document.querySelector('.rich-text-editor');
  if (richEditor) {
    richEditor.addEventListener('focus', function() {
      this.style.transform = 'scale(1.01)';
      this.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.3)';
      this.style.transition = 'all 0.3s ease';
    });
    
    richEditor.addEventListener('blur', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '';
    });
  }
  
  // Efectos para toolbar del editor
  const toolbarButtons = document.querySelectorAll('.editor-toolbar button');
  toolbarButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.style.animation = 'bounce 0.4s ease-in-out';
      
      // Efecto de selección
      this.classList.toggle('tool-active');
    });
  });
}

// Función para animar tabla de gestión de artículos
function animateArticlesTable() {
  const rows = document.querySelectorAll('.articles-table tbody tr');
  
  rows.forEach((row, index) => {
    row.style.animationDelay = `${index * 0.06}s`;
    row.classList.add('slide-in-left');
    
    // Efectos para estado de publicación
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.addEventListener('click', function() {
        this.style.animation = 'pulse 0.5s ease-in-out';
        
        // Cambiar estado con animación
        const currentStatus = this.textContent.trim();
        if (currentStatus === 'Borrador') {
          this.textContent = 'Publicado';
          this.className = 'status-badge published';
        } else {
          this.textContent = 'Borrador';
          this.className = 'status-badge draft';
        }
      });
    }
    
    // Efectos para acciones de la tabla
    const actionButtons = row.querySelectorAll('.article-action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.style.animation = 'shake 0.5s ease-in-out';
      });
    });
  });
}

// Función para animar vista previa de artículos
function animateArticlePreview() {
  const previewButton = document.querySelector('.preview-btn');
  const previewModal = document.querySelector('.article-preview-modal');
  
  if (previewButton && previewModal) {
    previewButton.addEventListener('click', function() {
      previewModal.classList.add('preview-modal-show');
      
      // Animar contenido de la vista previa
      const previewContent = previewModal.querySelector('.preview-content');
      if (previewContent) {
        previewContent.style.animation = 'typewriter 2s steps(40, end)';
      }
    });
  }
}

// Función para animar métricas de rendimiento
function animatePerformanceMetrics() {
  const metrics = document.querySelectorAll('.performance-metric');
  
  metrics.forEach((metric, index) => {
    metric.style.animationDelay = `${index * 0.3}s`;
    metric.classList.add('metric-appear');
    
    // Animar gráficos de línea
    const lineChart = metric.querySelector('.line-chart');
    if (lineChart) {
      setTimeout(() => {
        const path = lineChart.querySelector('path');
        if (path) {
          const pathLength = path.getTotalLength();
          path.style.strokeDasharray = pathLength;
          path.style.strokeDashoffset = pathLength;
          path.style.transition = 'stroke-dashoffset 2s ease-in-out';
          
          setTimeout(() => {
            path.style.strokeDashoffset = 0;
          }, 100);
        }
      }, 500 + (index * 300));
    }
  });
}

// Función para animar comentarios y feedback
function animateArticleComments() {
  const comments = document.querySelectorAll('.article-comment');
  
  comments.forEach((comment, index) => {
    comment.style.animationDelay = `${index * 0.15}s`;
    comment.classList.add('comment-slide-in');
    
    // Efectos para botones de moderación
    const moderationButtons = comment.querySelectorAll('.moderation-btn');
    moderationButtons.forEach(button => {
      button.addEventListener('click', function() {
        this.style.animation = 'pulse 0.3s ease-in-out';
        
        // Efecto de aprobación/rechazo
        if (this.classList.contains('approve-btn')) {
          comment.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
          comment.style.borderLeft = '4px solid #10b981';
        } else if (this.classList.contains('reject-btn')) {
          comment.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          comment.style.borderLeft = '4px solid #ef4444';
        }
      });
    });
  });
}

// Función principal de inicialización
function initArticlesDashboardAnimations() {
  // Secuencia de animaciones
  setTimeout(() => animateArticlesStats(), 100);
  setTimeout(() => animateArticlesCategories(), 300);
  setTimeout(() => animateArticlesCards(), 500);
  setTimeout(() => animateArticlesTable(), 700);
  setTimeout(() => animateArticlesEditor(), 900);
  setTimeout(() => animatePerformanceMetrics(), 1100);
  setTimeout(() => animateArticleComments(), 1300);
  setTimeout(() => animateArticlePreview(), 1500);
}

// Función para efectos de interacción específicos
function initArticlesInteractions() {
  // Efectos para botones de like en artículos
  const likeButtons = document.querySelectorAll('.article-like-btn');
  likeButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.classList.toggle('liked');
      this.style.animation = 'heartbeat 0.8s ease-in-out';
      
      // Efecto de partículas de corazón
      for (let i = 0; i < 3; i++) {
        const heart = document.createElement('div');
        heart.innerHTML = '💜';
        heart.className = 'floating-heart';
        heart.style.left = Math.random() * 30 + 'px';
        heart.style.animationDelay = i * 0.2 + 's';
        this.appendChild(heart);
        
        setTimeout(() => heart.remove(), 1500);
      }
    });
  });
  
  // Efectos para botones de bookmark
  const bookmarkButtons = document.querySelectorAll('.bookmark-btn');
  bookmarkButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.classList.toggle('bookmarked');
      this.style.animation = 'bookmark-save 0.6s ease-in-out';
    });
  });
  
  // Efectos para compartir artículos
  const shareButtons = document.querySelectorAll('.article-share-btn');
  shareButtons.forEach(button => {
    button.addEventListener('click', function() {
      this.style.animation = 'share-bounce 0.5s ease-in-out';
      
      // Mostrar opciones de compartir con animación
      const shareMenu = this.nextElementSibling;
      if (shareMenu && shareMenu.classList.contains('share-menu')) {
        shareMenu.classList.add('share-menu-show');
        
        const shareOptions = shareMenu.querySelectorAll('.share-option');
        shareOptions.forEach((option, index) => {
          option.style.animationDelay = `${index * 0.1}s`;
          option.classList.add('share-option-appear');
        });
      }
    });
  });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initArticlesDashboardAnimations();
  initArticlesInteractions();
});

// Exportar funciones para uso externo
window.ArticlesDashboardAnimations = {
  animateArticlesCards,
  animateArticlesStats,
  animateArticlesCategories,
  animateArticlesTable,
  animatePerformanceMetrics
};