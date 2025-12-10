// Animaciones para Dashboard Administrativo

// Función para animar las tarjetas de acciones rápidas
function animateQuickActionCards() {
  const cards = document.querySelectorAll('.quick-action-card');
  
  cards.forEach((card, index) => {
    // Añadir delay escalonado para efecto de cascada
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('fade-in-up');
    
    // Efectos hover mejorados
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
      this.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
      this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
      this.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
    });
  });
}

// Función para animar las estadísticas
function animateStatsCards() {
  const statsCards = document.querySelectorAll('.stat-card');
  
  statsCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
    card.classList.add('slide-in-right');
    
    // Animación de números contadores
    const numberElement = card.querySelector('.stat-number');
    if (numberElement) {
      animateCounter(numberElement);
    }
  });
}

// Función para animar contadores numéricos
function animateCounter(element) {
  const target = parseInt(element.textContent);
  const duration = 2000; // 2 segundos
  const increment = target / (duration / 16); // 60fps
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}

// Función para animar la barra de navegación del dashboard
function animateDashboardHeader() {
  const header = document.querySelector('.dashboard-header');
  if (header) {
    header.classList.add('slide-down');
  }
}

// Función para animar modales
function animateModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (show) {
    modal.style.display = 'flex';
    modal.classList.add('modal-fade-in');
    const modalContent = modal.querySelector('.modal-contenido');
    if (modalContent) {
      modalContent.classList.add('modal-scale-in');
    }
  } else {
    modal.classList.add('modal-fade-out');
    const modalContent = modal.querySelector('.modal-contenido');
    if (modalContent) {
      modalContent.classList.add('modal-scale-out');
    }
    
    setTimeout(() => {
      modal.style.display = 'none';
      modal.classList.remove('modal-fade-in', 'modal-fade-out');
      if (modalContent) {
        modalContent.classList.remove('modal-scale-in', 'modal-scale-out');
      }
    }, 300);
  }
}

// Función para efectos de carga de página
function initPageLoadAnimations() {
  // Ocultar elementos inicialmente
  const animatedElements = document.querySelectorAll('.quick-action-card, .stat-card, .dashboard-header');
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
  });
  
  // Animar elementos secuencialmente
  setTimeout(() => {
    animateDashboardHeader();
  }, 100);
  
  setTimeout(() => {
    animateQuickActionCards();
  }, 300);
  
  setTimeout(() => {
    animateStatsCards();
  }, 500);
}

// Función para efectos de transición entre páginas
function initPageTransitions() {
  const links = document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"])');
  
  links.forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.target === '_blank') return;
      
      e.preventDefault();
      const href = this.href;
      
      // Efecto de fade out
      document.body.classList.add('page-transition-out');
      
      setTimeout(() => {
        window.location.href = href;
      }, 300);
    });
  });
}

// Función para efectos de scroll
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in-view');
      }
    });
  }, observerOptions);
  
  // Observar elementos que deben animarse al hacer scroll
  const scrollElements = document.querySelectorAll('.dashboard-section, .admin-table, .chart-container');
  scrollElements.forEach(el => observer.observe(el));
}

// Función para efectos de botones
function initButtonAnimations() {
  const buttons = document.querySelectorAll('button, .btn, .boton-confirmar, .boton-cancelar');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      // Efecto ripple
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple-effect');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// Inicializar todas las animaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initPageLoadAnimations();
  initPageTransitions();
  initScrollAnimations();
  initButtonAnimations();
});

// Exportar funciones para uso externo
window.AdminDashboardAnimations = {
  animateModal,
  animateCounter,
  animateQuickActionCards,
  animateStatsCards
};