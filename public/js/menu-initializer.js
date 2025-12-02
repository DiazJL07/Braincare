// Script para asegurar que los menús de administrador e idioma funcionen en todas las páginas

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded: Inicializando menús...');
  
  // Inicializar menús sin dependencias de Bootstrap
  console.log('Inicializando menús con funcionalidad nativa...');
  initializeAdminMenu();
  initializeLanguageMenu();
  
  // Función eliminada - funcionalidad movida a funciones específicas de menús
  
  // Función eliminada - Bootstrap ya no es necesario para la navegación

  // Inicializar el menú de idiomas
  function initializeLanguageMenu() {
    try {
      // Seleccionar todos los dropdowns de idioma por ID y clase
      const languageDropdownsById = document.querySelectorAll('#translateDropdown');
      const languageDropdownsByClass = document.querySelectorAll('.translate-dropdown');
      
      // Combinar los resultados (convertir NodeList a Array)
      const languageDropdowns = [...Array.from(languageDropdownsById), ...Array.from(languageDropdownsByClass)];
      
      // Eliminar duplicados si hay elementos que coinciden con ambos selectores
      const uniqueLanguageDropdowns = [...new Set(languageDropdowns)];
      const languageOptions = document.querySelectorAll('.language-option');
      
      if (uniqueLanguageDropdowns.length > 0 && languageOptions.length > 0) {
        console.log(`Encontrados ${uniqueLanguageDropdowns.length} menús de idioma`);
        
        // Recuperar el idioma guardado en localStorage
        const savedLanguage = localStorage.getItem('selectedLanguage') || 'es';
        
        uniqueLanguageDropdowns.forEach((translateDropdown, index) => {
          try {
            // Asegurarse de que el dropdown tenga un ID
            if (!translateDropdown.id) {
              translateDropdown.id = `translateDropdown_${index}`;
            }
            
            // Usar funcionalidad nativa en lugar de Bootstrap
            setupManualDropdown(translateDropdown);
            console.log(`Menú de idioma #${index + 1} inicializado con funcionalidad nativa`);
          } catch (error) {
            console.error(`Error al inicializar menú de idioma #${index + 1}:`, error);
            // Fallback manual si hay un error
            setupManualDropdown(translateDropdown);
          }
        });
        
        // Agregar event listeners a las opciones de idioma
        languageOptions.forEach(option => {
          option.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.dataset.lang;
            if (lang) {
              localStorage.setItem('selectedLanguage', lang);
              // Actualizar la bandera y el idioma activo
              uniqueLanguageDropdowns.forEach(dropdown => {
                const flagElement = dropdown.querySelector('#currentFlag');
                if (flagElement) {
                  flagElement.textContent = this.dataset.flag || '🌐';
                }
              });
              // Marcar como activo
              languageOptions.forEach(opt => {
                if (opt.dataset.lang === lang) {
                  opt.classList.add('active');
                } else {
                  opt.classList.remove('active');
                }
              });
            }
          });
        });
        
        console.log('Menú(s) de idioma inicializado(s) correctamente');
      } else {
        console.warn('Elementos del menú de idioma no encontrados');
      }
    } catch (error) {
      console.error('Error al inicializar menús de idioma:', error);
    }
  }

  // Inicializar el menú de administración
  function initializeAdminMenu() {
    try {
      // Seleccionar todos los dropdowns de administración por ID y clase
      const adminDropdownsById = document.querySelectorAll('#adminDropdown');
      const adminDropdownsByClass = document.querySelectorAll('.admin-dropdown');
      
      // Combinar los resultados (convertir NodeList a Array)
      const adminDropdowns = [...Array.from(adminDropdownsById), ...Array.from(adminDropdownsByClass)];
      
      // Eliminar duplicados si hay elementos que coinciden con ambos selectores
      const uniqueAdminDropdowns = [...new Set(adminDropdowns)];
      
      if (uniqueAdminDropdowns.length > 0) {
        console.log(`Encontrados ${uniqueAdminDropdowns.length} menús de administración`);
        
        uniqueAdminDropdowns.forEach((dropdown, index) => {
          try {
            // Asegurarse de que el dropdown tenga un ID
            if (!dropdown.id) {
              dropdown.id = `adminDropdown_${index}`;
            }
            
            // Usar funcionalidad nativa en lugar de Bootstrap
            setupManualDropdown(dropdown);
            console.log(`Menú de administración #${index + 1} inicializado con funcionalidad nativa`);
            
            // Asegurarse de que los eventos de clic estén configurados solo para el toggle
            const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
            if (dropdownToggle) {
              dropdownToggle.addEventListener('click', function(e) {
                // Solo manejar el toggle, no los enlaces del menú
                if (e.target === this) {
                  const dropdownMenu = dropdown.querySelector('.dropdown-menu');
                  if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                    e.stopPropagation();
                  }
                }
              });
            }
          } catch (error) {
            console.error(`Error al inicializar menú de administración #${index + 1}:`, error);
            // Fallback manual si hay un error
            setupManualDropdown(dropdown);
          }
        });
      } else {
        console.log('No se encontraron menús de administración');
      }
    } catch (error) {
      console.error('Error al inicializar menús de administración:', error);
    }
  }
  
  // Configuración manual de dropdown
  function setupManualDropdown(dropdownElement) {
    if (!dropdownElement) return;
    
    const toggleButton = dropdownElement.querySelector('.dropdown-toggle') || dropdownElement;
    const dropdownMenu = document.querySelector(`[aria-labelledby="${dropdownElement.id}"]`) || 
                         dropdownElement.querySelector('.dropdown-menu');
    
    if (!dropdownMenu) return;
    
    // Agregar evento de clic al botón de toggle
    toggleButton.addEventListener('click', function(e) {
      // Solo prevenir el comportamiento por defecto si es un enlace sin href válido
      if (e.target.tagName === 'A' && (!e.target.href || e.target.href === '#')) {
        e.preventDefault();
      }
      e.stopPropagation();
      
      // Alternar la clase show para mostrar/ocultar el menú
      const isVisible = dropdownMenu.classList.contains('show');
      
      // Cerrar todos los dropdowns abiertos primero
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== dropdownMenu) {
          menu.classList.remove('show');
        }
      });
      
      // Alternar la visibilidad del menú actual
      if (isVisible) {
        dropdownMenu.classList.remove('show');
      } else {
        dropdownMenu.classList.add('show');
        
        // Posicionar el menú correctamente
        const rect = toggleButton.getBoundingClientRect();
        dropdownMenu.style.top = rect.bottom + 'px';
        dropdownMenu.style.left = rect.left + 'px';
      }
    });
    
    // Cerrar el dropdown al hacer clic fuera, pero no en los elementos del menú
    document.addEventListener('click', function(e) {
      // No cerrar si el clic es dentro del dropdown o en un enlace del menú
      if (!dropdownElement.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
    
    // Prevenir que los clics en elementos del menú cierren el dropdown
    dropdownMenu.addEventListener('click', function(e) {
      // Solo cerrar si es un enlace que navega a otra página
      if (e.target.tagName === 'A' && e.target.href && e.target.href !== '#' && !e.target.href.includes('javascript:')) {
        // Permitir la navegación y cerrar el menú
        setTimeout(() => {
          dropdownMenu.classList.remove('show');
        }, 100);
      } else {
        // Para otros elementos, mantener el menú abierto
        e.stopPropagation();
      }
    });
    
    // Cerrar el dropdown al presionar la tecla Escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && dropdownMenu.classList.contains('show')) {
        dropdownMenu.classList.remove('show');
      }
    });
  }

  // Funciones auxiliares para el menú de idioma
  function updateCurrentFlag(language) {
    const translateDropdown = document.getElementById('translateDropdown');
    if (!translateDropdown) return;
    
    // Buscar la opción de idioma seleccionada
    const selectedOption = document.querySelector(`.language-option[data-lang="${language}"]`);
    if (selectedOption) {
      // Obtener la bandera del idioma seleccionado
      const flag = selectedOption.dataset.flag || '🌐';
      
      // Actualizar el contenido del botón de idioma
      const flagElement = translateDropdown.querySelector('.current-flag');
      if (flagElement) {
        flagElement.textContent = flag;
      } else {
        // Si no existe el elemento, crear uno nuevo
        const newFlagElement = document.createElement('span');
        newFlagElement.className = 'current-flag';
        newFlagElement.textContent = flag;
        translateDropdown.prepend(newFlagElement);
      }
    }
  }
  
  function setActiveLanguage(language) {
    // Marcar como activo el idioma seleccionado
    document.querySelectorAll('.language-option').forEach(option => {
      if (option.dataset.lang === language) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
  
  // Ejecutar las inicializaciones
  setTimeout(function() {
    initializeLanguageMenu();
    initializeAdminMenu();
  }, 500); // Pequeño retraso para asegurar que todos los elementos estén cargados
});