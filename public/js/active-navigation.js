/**
 * Sistema de Navegación Activa con Animaciones
 * Maneja la detección automática de la sección actual y aplica estilos visuales
 */

(function() {
  'use strict';
  
  // Evitar redeclaración si ya existe
  if (window.ActiveNavigation) {
    return;
  }

class ActiveNavigation {
  constructor() {
    this.currentPath = window.location.pathname;
    this.navLinks = [];
    this.mobileMenuItems = [];
    this.init();
  }

  init() {
    // Esperar a que el DOM esté completamente cargado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.findNavigationElements();
    this.setActiveStates();
    this.addEventListeners();
    this.addScrollEffects();
    
    // Actualizar navegación cuando cambie la URL (para SPAs)
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.setActiveStates();
    });
    
    // Observar cambios en el DOM para mantener la navegación actualizada
    this.observePageChanges();
    
    // Verificar periódicamente que la navegación esté correcta
    setInterval(() => {
      this.setActiveStates();
    }, 2000);
  }

  findNavigationElements() {
    // Encontrar todos los enlaces de navegación
    this.navLinks = Array.from(document.querySelectorAll('.nav-link'));
    this.mobileMenuItems = Array.from(document.querySelectorAll('.mobile-menu .menu-item'));
    
    console.log('🔍 Elementos de navegación encontrados:', {
      navLinks: this.navLinks.length,
      mobileMenuItems: this.mobileMenuItems.length
    });
  }

  setActiveStates() {
    // Limpiar estados activos existentes
    this.clearActiveStates();
    
    // Determinar la ruta activa
    const activeRoute = this.determineActiveRoute();
    
    // Aplicar estados activos
    this.applyActiveStates(activeRoute);
    
    console.log('✅ Estado activo aplicado para:', activeRoute);
  }

  clearActiveStates() {
    // Limpiar enlaces de navegación
    this.navLinks.forEach(link => {
      link.classList.remove('active', 'active-dot');
      link.classList.remove('loading');
      link.style.transform = '';
      link.style.transition = '';
      link.style.boxShadow = '';
      link.style.textShadow = '';
    });
    
    // Limpiar elementos del menú móvil
    this.mobileMenuItems.forEach(item => {
      item.classList.remove('active');
    });
  }

  determineActiveRoute() {
    const path = this.currentPath.toLowerCase();
    
    // Mapeo de rutas a secciones (más completo)
    const routeMap = {
      '/': 'home',
      '/articles': 'articles',
      '/article': 'articles',
      '/foro': 'foro',
      '/forum': 'foro',
      '/guides': 'guides',
      '/guide': 'guides',
      '/ruta2': 'legal',
      '/nosotros': 'about',
      '/coki': 'coki',
      '/ruta5': 'coki',
      '/ruta6': 'coki',
      '/ruta7': 'coki',
      '/ruta8': 'coki',
      '/ia': 'coki',
      '/admin': 'admin',
      '/user': 'profile',
      '/user/profile': 'profile',
      '/profile': 'profile'
    };

    // Buscar coincidencia exacta primero
    if (routeMap[path]) {
      return routeMap[path];
    }

    // Buscar coincidencias parciales (más específicas)
    for (const [route, section] of Object.entries(routeMap)) {
      if (path.startsWith(route) && route !== '/') {
        return section;
      }
    }

    // Detectar por contenido de la página si no hay coincidencia de ruta
    return this.determineByPageContent() || 'home';
  }

  determineByPageContent() {
    // Intentar determinar la sección por el título de la página
    const title = document.title.toLowerCase();
    
    if (title.includes('artículo') || title.includes('article')) return 'articles';
    if (title.includes('foro') || title.includes('forum')) return 'foro';
    if (title.includes('guía') || title.includes('guide')) return 'guides';
    if (title.includes('coki') || title.includes('ia')) return 'coki';
    if (title.includes('perfil') || title.includes('profile')) return 'profile';
    if (title.includes('admin')) return 'admin';
    
    // Por defecto, considerar como inicio
    return 'home';
  }

  applyActiveStates(activeRoute) {
    // Mapeo de identificadores a selectores
    const selectorMap = {
      'home': ['[data-section="home"]', '[href="/"]'],
      'articles': ['[data-section="articles"]'],
      'foro': ['[data-section="foro"]', '[href="/foro"]'],
      'guides': ['[data-section="guides"]', '[href="/guides"]'],
      'legal': ['[data-section="legal"]', '[href="/ruta2"]'],
      'about': ['[data-section="about"]', '[href="/nosotros"]'],
      'coki': ['[data-section="coki"]', '[href="/coki"]', '[href="/ia"]'],
      'profile': ['[data-section="profile"]', '[href="/user/profile"]'],
      'admin': ['[href*="/admin"]']
    };

    const selectors = selectorMap[activeRoute] || [];
    
    selectors.forEach(selector => {
      // Aplicar a enlaces de navegación
      const navLink = document.querySelector(`.nav-link${selector}`);
      if (navLink) {
        navLink.classList.add('active');
        // Animaciones deshabilitadas para enlaces activos
      }
      
      // Aplicar a elementos del menú móvil
      const mobileItem = document.querySelector(`.mobile-menu .menu-item${selector}`);
      if (mobileItem) {
        mobileItem.classList.add('active');
        this.addMobileActiveAnimation(mobileItem);
      }
    });
  }



  addActiveAnimation(element) {
    // Animación y partículas deshabilitadas
  }

  addMobileActiveAnimation(element) {
    // Animación específica para menú móvil
    element.style.transform = 'translateX(-10px)';
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    }, 100);
  }

  addParticleEffect(element) { /* deshabilitado */ }

  addEventListeners() {
    // Agregar efectos hover mejorados
    this.navLinks.forEach(link => {
      link.addEventListener('mouseenter', (e) => this.handleHover(e, true));
      link.addEventListener('mouseleave', (e) => this.handleHover(e, false));
      link.addEventListener('click', (e) => this.handleClick(e));
    });

    // Agregar efectos para menú móvil
    this.mobileMenuItems.forEach(item => {
      item.addEventListener('click', (e) => this.handleMobileClick(e));
    });
  }

  handleHover(event, isEntering) {
    const link = event.target;
    
    if (isEntering && !link.classList.contains('active')) {
      // Efecto hover de entrada
      link.style.transform = 'translateY(-2px) scale(1.02)';
      link.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      
      // Agregar brillo sutil
      this.addGlowEffect(link);
    } else if (!isEntering && !link.classList.contains('active')) {
      // Efecto hover de salida
      link.style.transform = 'translateY(0) scale(1)';
      this.removeGlowEffect(link);
    }
  }

  addGlowEffect(element) {
    element.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)';
    element.style.textShadow = '0 0 10px rgba(102, 126, 234, 0.3)';
  }

  removeGlowEffect(element) {
    element.style.boxShadow = 'none';
    element.style.textShadow = 'none';
  }

  handleClick(event) {
    const link = event.target;
    if (link.dataset && link.dataset.bsToggle === 'dropdown') {
      event.preventDefault();
      return;
    }
    
    // Efecto de ondas al hacer clic
    this.createRippleEffect(event);
    
    // Agregar clase de carga temporal
    link.classList.add('loading');
    
    setTimeout(() => {
      link.classList.remove('loading');
    }, 1000);
  }

  handleMobileClick(event) {
    const item = event.target;
    
    // Efecto de feedback táctil
    item.style.transform = 'scale(0.95)';
    item.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      item.style.transform = 'scale(1)';
    }, 150);
  }

  createRippleEffect(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  observePageChanges() {
    // Observar cambios en el título de la página
    const titleObserver = new MutationObserver(() => {
      this.setActiveStates();
    });
    
    titleObserver.observe(document.querySelector('title') || document.head, {
      childList: true,
      characterData: true
    });
    
    // Observar cambios en el contenido principal
    const contentObserver = new MutationObserver(() => {
      // Verificar si hay nuevos elementos de navegación
      this.findNavigationElements();
      this.setActiveStates();
    });
    
    const mainContent = document.querySelector('main') || document.body;
    contentObserver.observe(mainContent, {
      childList: true,
      subtree: true
    });
  }

  addScrollEffects() {
    return;
  }

  // Método público para actualizar manualmente la navegación
  updateNavigation(newPath) {
    this.currentPath = newPath || window.location.pathname;
    this.setActiveStates();
  }

  // Método para agregar efectos especiales en fechas especiales
  addSpecialEffects() {
    const today = new Date();
    const isHoliday = this.checkIfHoliday(today);
    
    if (isHoliday) {
      this.navLinks.forEach(link => {
        link.style.animation += ', holidaySparkle 3s ease-in-out infinite';
      });
    }
  }

  checkIfHoliday(date) {
    // Verificar si es una fecha especial
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Navidad
    if (month === 12 && day === 25) return true;
    // Año nuevo
    if (month === 1 && day === 1) return true;
    
    return false;
  }
}

// Agregar estilos CSS dinámicos para las animaciones
const addDynamicStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes activeEntrance {
      0% {
        transform: translateY(-10px) scale(0.9);
        opacity: 0;
      }
      50% {
        transform: translateY(-5px) scale(1.05);
      }
      100% {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    
    @keyframes particleFloat {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-30px) scale(0);
      }
    }
    
    @keyframes ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
    
    @keyframes holidaySparkle {
      0%, 100% {
        filter: hue-rotate(0deg) brightness(1);
      }
      25% {
        filter: hue-rotate(90deg) brightness(1.2);
      }
      50% {
        filter: hue-rotate(180deg) brightness(1.1);
      }
      75% {
        filter: hue-rotate(270deg) brightness(1.2);
      }
    }
  `;
  document.head.appendChild(style);
};

// Inicializar el sistema cuando se cargue el script
addDynamicStyles();

// Inicializar el sistema cuando el DOM esté listo, evitando duplicaciones
if (!window.activeNavigation) {
  window.activeNavigation = new ActiveNavigation();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ActiveNavigation;
}

// Función global para actualizar la navegación desde otros scripts
if (!window.updateActiveNavigation) {
  window.updateActiveNavigation = (path) => {
    if (window.activeNavigation) {
      window.activeNavigation.updateNavigation(path);
    }
  };
}

console.log('🚀 Sistema de Navegación Activa inicializado correctamente');

// Hacer la clase disponible globalmente
window.ActiveNavigation = ActiveNavigation;

})(); // Fin de la función IIFE
