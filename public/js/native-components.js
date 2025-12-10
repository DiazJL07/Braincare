/* JavaScript Nativo - Reemplazo de Bootstrap JS */

// Funcionalidad para Navbar Toggle
function initNavbarToggle() {
  const togglers = document.querySelectorAll('.navbar-toggler, .nav-toggler');
  
  togglers.forEach(toggler => {
    toggler.addEventListener('click', function() {
      const target = this.getAttribute('data-bs-target') || this.getAttribute('data-target');
      const collapse = document.querySelector(target) || this.nextElementSibling;
      
      if (collapse) {
        collapse.classList.toggle('show');
        this.setAttribute('aria-expanded', collapse.classList.contains('show'));
      }
    });
  });
}

// Funcionalidad para Dropdown
function initDropdowns() {
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
  
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Cerrar otros dropdowns
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== this.nextElementSibling) {
          menu.classList.remove('show');
        }
      });
      
      // Toggle el dropdown actual
      const menu = this.nextElementSibling;
      if (menu && menu.classList.contains('dropdown-menu')) {
        menu.classList.toggle('show');
      }
    });
  });
  
  // Cerrar dropdowns al hacer click fuera
  document.addEventListener('click', function() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  });
}

// Funcionalidad para Modal
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"], [data-toggle="modal"]');
  const modals = document.querySelectorAll('.modal');
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-bs-target') || this.getAttribute('data-target');
      const modal = document.querySelector(target);
      
      if (modal) {
        showModal(modal);
      }
    });
  });
  
  modals.forEach(modal => {
    // Cerrar modal con botón close
    const closeButtons = modal.querySelectorAll('[data-bs-dismiss="modal"], [data-dismiss="modal"]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        hideModal(modal);
      });
    });
    
    // Cerrar modal al hacer click en el backdrop
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        hideModal(this);
      }
    });
  });
  
  // Cerrar modal con ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        hideModal(openModal);
      }
    }
  });
}

function showModal(modal) {
  modal.style.display = 'block';
  modal.classList.add('show');
  document.body.classList.add('modal-open');
  
  // Crear backdrop si no existe
  if (!document.querySelector('.modal-backdrop')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show';
    document.body.appendChild(backdrop);
  }
}

function hideModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 150);
  
  document.body.classList.remove('modal-open');
  
  // Remover backdrop
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.remove();
  }
}

// Funcionalidad para Collapse
function initCollapse() {
  const collapseToggles = document.querySelectorAll('[data-bs-toggle="collapse"], [data-toggle="collapse"]');
  
  collapseToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('data-bs-target') || this.getAttribute('data-target');
      const collapse = document.querySelector(target);
      
      if (collapse) {
        collapse.classList.toggle('show');
        this.setAttribute('aria-expanded', collapse.classList.contains('show'));
      }
    });
  });
}

// Funcionalidad para Tabs
function initTabs() {
  const tabTriggers = document.querySelectorAll('[data-bs-toggle="tab"], [data-toggle="tab"]');
  
  tabTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      
      const target = this.getAttribute('data-bs-target') || this.getAttribute('href');
      const tabPane = document.querySelector(target);
      
      if (tabPane) {
        // Remover active de todos los tabs y panes
        const tabList = this.closest('.nav-tabs, .nav-pills');
        if (tabList) {
          tabList.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
          });
        }
        
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('show', 'active');
        });
        
        // Activar tab y pane actual
        this.classList.add('active');
        tabPane.classList.add('show', 'active');
      }
    });
  });
}

// Funcionalidad para Alert
function initAlerts() {
  const alertCloseButtons = document.querySelectorAll('.alert [data-bs-dismiss="alert"], .alert [data-dismiss="alert"]');
  
  alertCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.closest('.alert');
      if (alert) {
        alert.classList.add('fade');
        setTimeout(() => {
          alert.remove();
        }, 150);
      }
    });
  });
}

// Funcionalidad para Tooltip (básica)
function initTooltips() {
  const tooltipTriggers = document.querySelectorAll('[data-bs-toggle="tooltip"], [data-toggle="tooltip"]');
  
  tooltipTriggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', function() {
      const title = this.getAttribute('title') || this.getAttribute('data-bs-title');
      if (title) {
        showTooltip(this, title);
      }
    });
    
    trigger.addEventListener('mouseleave', function() {
      hideTooltip();
    });
  });
}

function showTooltip(element, text) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip fade show';
  tooltip.innerHTML = `<div class="tooltip-inner">${text}</div>`;
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'absolute';
  tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
  tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
  tooltip.style.zIndex = '1070';
}

function hideTooltip() {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}

// Funcionalidad para Carousel (básica)
function initCarousels() {
  const carousels = document.querySelectorAll('.carousel');
  
  carousels.forEach(carousel => {
    const items = carousel.querySelectorAll('.carousel-item');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    const indicators = carousel.querySelectorAll('.carousel-indicators button');
    
    let currentIndex = 0;
    
    function showSlide(index) {
      items.forEach((item, i) => {
        item.classList.toggle('active', i === index);
      });
      
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showSlide(currentIndex);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % items.length;
        showSlide(currentIndex);
      });
    }
    
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', function() {
        currentIndex = index;
        showSlide(currentIndex);
      });
    });
  });
}

// Inicializar todos los componentes cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  initNavbarToggle();
  initDropdowns();
  initModals();
  initCollapse();
  initTabs();
  initAlerts();
  initTooltips();
  initCarousels();
});

// Exportar funciones para uso global
window.NativeComponents = {
  initNavbarToggle,
  initDropdowns,
  initModals,
  initCollapse,
  initTabs,
  initAlerts,
  initTooltips,
  initCarousels,
  showModal,
  hideModal,
  showTooltip,
  hideTooltip
};