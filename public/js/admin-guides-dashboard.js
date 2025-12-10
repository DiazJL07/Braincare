// JavaScript Independiente para Dashboard de Administración de Guías
// Tema: Psicología - Funcionalidades y Animaciones Específicas

(function() {
    'use strict';

    // Configuración global del dashboard de guías
    const GuidesConfig = {
        animationDuration: 600,
        staggerDelay: 150,
        updateInterval: 45000, // 45 segundos
        typewriterSpeed: 80,
        rippleEffectDuration: 600,
        chartUpdateInterval: 10000
    };

    // Estado global del dashboard
    const GuidesState = {
        isLoading: false,
        lastUpdate: null,
        sortDirection: 'desc',
        currentFilter: 'all',
        animationsEnabled: true,
        realTimeUpdates: true
    };

    // Inicialización del dashboard cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        initializeGuidesAnimations();
        setupGuidesEventListeners();
        initializeGuidesStats();
        setupRealTimeUpdates();
        initializeGuidesTable();
        setupGuidesInteractions();
        // initializeGuidesTooltips(); // Tooltips desactivados
        console.log('🌿 Dashboard de Guías inicializado correctamente');
        
        // Inicializar funcionalidad del modal
        initializeGuideModal();

        // Inicializar paginación al cargar
        if (typeof renderGuidesPagination === 'function') {
            renderGuidesPagination();
        }
        if (typeof applyGuidesPage === 'function') {
            applyGuidesPage();
        }
    });

    // Animaciones de entrada para elementos del dashboard
    function initializeGuidesAnimations() {
        // Animación del título con efecto typewriter
        const titleElement = document.querySelector('.guides-dashboard-header h1');
        if (titleElement) {
            typewriterEffect(titleElement, titleElement.textContent);
        }

        // Animaciones escalonadas para las tarjetas de estadísticas
        const statCards = document.querySelectorAll('.guides-stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-50px)';
            
            setTimeout(() => {
                card.style.transition = `all ${GuidesConfig.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
                
                // Animación del número con conteo
                const numberElement = card.querySelector('.guides-stat-number');
                if (numberElement) {
                    animateNumber(numberElement, parseInt(numberElement.textContent) || 0);
                }
            }, index * GuidesConfig.staggerDelay);
        });

        // Animación de entrada para las filas de la tabla
        const tableRows = document.querySelectorAll('.guides-table tbody tr');
        tableRows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                row.style.transition = `all ${GuidesConfig.animationDuration}ms ease-out`;
                row.style.opacity = '1';
                row.style.transform = 'translateY(0)';
            }, 800 + (index * 100));
        });
    }

    // Efecto typewriter para el título
    function typewriterEffect(element, text) {
        element.textContent = '';
        let index = 0;
        
        function typeChar() {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                setTimeout(typeChar, GuidesConfig.typewriterSpeed);
            }
        }
        
        setTimeout(typeChar, 500);
    }

    // Animación de números con conteo progresivo
    function animateNumber(element, targetNumber) {
        const startNumber = 0;
        const duration = 2000;
        const startTime = performance.now();
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Función de easing para suavizar la animación
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * easeOutQuart);
            
            element.textContent = currentNumber.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = targetNumber.toLocaleString();
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    // Configuración de event listeners específicos para guías
    function setupGuidesEventListeners() {
        // Botones de acción con efecto ripple
        const actionButtons = document.querySelectorAll('.guides-action-button');
        actionButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                createRippleEffect(e, this);
            });
        });

        // Botones del header con animaciones
        const headerButtons = document.querySelectorAll('.guides-action-btn');
        headerButtons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-3px) scale(1.05)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Manejo de filtros y ordenamiento
        setupGuidesFiltering();
        
        // Configurar filtros avanzados
        setupAdvancedFilters();
        
        // Configurar búsqueda en tiempo real
        setupRealTimeSearch();
    }

    // Efecto ripple para botones
    function createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('guides-ripple');
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, GuidesConfig.rippleEffectDuration);
    }

    // Inicialización de estadísticas con mini gráficos
    function initializeGuidesStats() {
        const statCards = document.querySelectorAll('.guides-stat-card');
        
        statCards.forEach((card, index) => {
            // Agregar mini gráfico de tendencia
            const trendElement = card.querySelector('.guides-stat-trend');
            if (trendElement) {
                createMiniChart(trendElement, generateSampleData());
            }
            
            // Efecto de hover mejorado
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px) rotate(1deg) scale(1.02)';
                
                const icon = this.querySelector('.guides-stat-icon');
                if (icon) {
                    icon.style.animation = 'bounceIn 0.6s ease-out';
                }
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) rotate(0deg) scale(1)';
            });
        });
    }

    // Crear mini gráfico de tendencia
    function createMiniChart(container, data) {
        const canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 20;
        canvas.style.marginLeft = '10px';
        
        const ctx = canvas.getContext('2d');
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        
        ctx.strokeStyle = '#50C878';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = (index / (data.length - 1)) * canvas.width;
            const y = canvas.height - ((value - min) / range) * canvas.height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        container.appendChild(canvas);
    }

    // Generar datos de muestra para gráficos
    function generateSampleData() {
        return Array.from({length: 7}, () => Math.floor(Math.random() * 100) + 50);
    }

    // Configuración de actualizaciones en tiempo real
    function setupRealTimeUpdates() {
        const indicator = document.querySelector('.guides-real-time-indicator');
        if (!indicator) return;
        
        // Animación del indicador en tiempo real
        setInterval(() => {
            const dot = indicator.querySelector('.guides-real-time-dot');
            if (dot) {
                dot.style.animation = 'none';
                setTimeout(() => {
                    dot.style.animation = 'glow 2s infinite';
                }, 10);
            }
        }, 3000);
        
        // Actualización periódica de datos
        if (GuidesState.realTimeUpdates) {
            setInterval(updateGuidesData, GuidesConfig.updateInterval);
        }
    }

    // Actualización de datos de guías
    function updateGuidesData() {
        if (GuidesState.isLoading) return;
        
        GuidesState.isLoading = true;
        const indicator = document.querySelector('.guides-real-time-indicator');
        
        if (indicator) {
            indicator.style.opacity = '0.7';
            indicator.innerHTML = '<div class="guides-real-time-dot"></div>Actualizando...';
        }
        
        // Simular llamada a API
        setTimeout(() => {
            // Actualizar estadísticas
            updateStatistics();
            
            // Restaurar indicador
            if (indicator) {
                indicator.style.opacity = '1';
                indicator.innerHTML = '<div class="guides-real-time-dot"></div>En tiempo real';
            }
            
            GuidesState.isLoading = false;
            GuidesState.lastUpdate = new Date();
            
            console.log('📊 Datos de guías actualizados:', GuidesState.lastUpdate);
        }, 2000);
    }

    // Actualizar estadísticas con animación
    function updateStatistics() {
        const statNumbers = document.querySelectorAll('.guides-stat-number');
        
        statNumbers.forEach(element => {
            const currentValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
            const newValue = currentValue + Math.floor(Math.random() * 10) - 5;
            const finalValue = Math.max(0, newValue);
            
            animateNumber(element, finalValue);
        });
    }

    // Inicialización de la tabla de guías
    function initializeGuidesTable() {
        const table = document.querySelector('.guides-table');
        if (!table) return;
        
        // Configurar ordenamiento de columnas
        const headers = table.querySelectorAll('th');
        headers.forEach((header, index) => {
            if (index < headers.length - 1) { // Excluir columna de acciones
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => sortGuidesTable(index));
                
                // Agregar indicador de ordenamiento
                const sortIcon = document.createElement('span');
               
                sortIcon.style.opacity = '0.5';
                header.appendChild(sortIcon);
            }
        });
        
        // Efectos de hover mejorados para filas
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            row.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.02)';
                this.style.zIndex = '5';
            });
            
            row.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
                this.style.zIndex = '1';
            });
        });
    }

    // Ordenamiento de tabla con animación
    function sortGuidesTable(columnIndex) {
        const table = document.querySelector('.guides-table tbody');
        const rows = Array.from(table.querySelectorAll('tr'));
        
        // Animación de salida
        rows.forEach((row, index) => {
            row.style.transform = 'translateX(-100px)';
            row.style.opacity = '0.3';
        });
        
        setTimeout(() => {
            // Ordenar filas
            rows.sort((a, b) => {
                const aValue = a.cells[columnIndex].textContent.trim();
                const bValue = b.cells[columnIndex].textContent.trim();
                
                if (GuidesState.sortDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
            
            // Reordenar en el DOM
            rows.forEach(row => table.appendChild(row));
            
            // Animación de entrada
            rows.forEach((row, index) => {
                setTimeout(() => {
                    row.style.transform = 'translateX(0)';
                    row.style.opacity = '1';
                }, index * 50);
            });
            
            // Cambiar dirección de ordenamiento
            GuidesState.sortDirection = GuidesState.sortDirection === 'asc' ? 'desc' : 'asc';
        }, 300);
    }

    // Configuración de filtros
    function setupGuidesFiltering() {
        // Aquí se pueden agregar filtros específicos para guías
        // Por ejemplo: por categoría, estado, autor, etc.
    }

    // Configuración de interacciones específicas
    function setupGuidesInteractions() {
        // Manejo de acciones de la tabla
        setupGuidesTableActions();
        
        // Configurar búsqueda en tiempo real
        setupGuidesSearch();
        
        // Configurar exportación de datos
        setupGuidesExport();
    }

    // Acciones de la tabla de guías
    function setupGuidesTableActions() {
        // Botones de ver
        const viewButtons = document.querySelectorAll('.guides-btn-view');
        viewButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const guideId = this.dataset.id;
                showGuidePreview(guideId);
            });
        });
        
        // Botones de editar
        const editButtons = document.querySelectorAll('.guides-btn-edit');
        editButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const guideId = this.dataset.id;
                redirectToGuideEdit(guideId);
            });
        });
        
        // Botones de eliminar
        const deleteButtons = document.querySelectorAll('.guides-btn-delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const guideId = this.dataset.id;
                const guideName = this.dataset.name || 'esta guía';
                showGuideDeleteConfirmation(guideId, guideName);
            });
        });
    }

    // Vista previa de guía
    function showGuidePreview(guideId) {
        window.location.href = `/guides/${guideId}`;
    }

    // Redirección a edición de guía
    function redirectToGuideEdit(guideId) {
    console.log('redirectToGuideEdit llamado con ID:', guideId);
    window.location.href = `/guides/admin/${guideId}/edit`;
}

    // Confirmación de eliminación de guía
    function showGuideDeleteConfirmation(guideId, guideName) {
    console.log('showGuideDeleteConfirmation llamado con ID:', guideId, 'y Nombre:', guideName);
    const modal = document.querySelector('.guides-delete-modal');
    if (modal) {
        const nameElement = modal.querySelector('.guide-name');
        if (nameElement) {
            nameElement.textContent = guideName;
        }
        
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Configurar el formulario de eliminación
        const deleteForm = modal.querySelector('#deleteGuideForm');
        if (deleteForm) {
            deleteForm.action = `/guides/admin/${guideId}/delete`;
        }
    }
}

    // Ejecutar eliminación de guía
    function executeGuideDelete(guideId) {
        console.log('🗑️ Eliminando guía:', guideId);
        
        // Animación de eliminación de fila
        const row = document.querySelector(`tr[data-guide-id="${guideId}"]`);
        if (row) {
            row.style.transition = 'all 0.5s ease-out';
            row.style.transform = 'translateX(100px) scale(0.8)';
            row.style.opacity = '0';
            
            setTimeout(() => {
                row.remove();
                updateStatistics();
            }, 500);
        }
        
        // Cerrar modal
        const modal = document.querySelector('.guides-delete-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // Configuración de búsqueda
    function setupGuidesSearch() {
        const searchInput = document.querySelector('.guides-search-input');
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    filterGuidesTable(this.value);
                }, 300);
            });
        }
    }

    // Filtrar tabla de guías
    function filterGuidesTable(searchTerm) {
        const rows = document.querySelectorAll('.guides-table tbody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(term);
            
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = shouldShow ? '1' : '0.3';
            row.style.transform = shouldShow ? 'scale(1)' : 'scale(0.95)';
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    // Configuración de exportación
    function setupGuidesExport() {
        const exportButton = document.querySelector('.guides-export-btn');
        if (exportButton) {
            exportButton.addEventListener('click', function() {
                exportGuidesData();
            });
        }
    }

    // Exportar datos de guías
    function exportGuidesData() {
        console.log('📤 Exportando datos de guías...');
        // Implementar exportación a CSV/Excel
    }

    // Inicialización de tooltips
    function initializeGuidesTooltips() {
        const elementsWithTooltip = document.querySelectorAll('[data-tooltip]');
        
        elementsWithTooltip.forEach(element => {
            element.addEventListener('mouseenter', function(e) {
                showTooltip(e, this.dataset.tooltip);
            });
            
            element.addEventListener('mouseleave', function() {
                hideTooltip();
            });
        });
    }

    // Mostrar tooltip
    function showTooltip(event, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'guides-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #1B4332, #2D5A2D);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    }

    // Ocultar tooltip
    function hideTooltip() {
        const tooltip = document.querySelector('.guides-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }
    }

    // Agregar estilos CSS para el efecto ripple
    const rippleStyles = document.createElement('style');
    rippleStyles.textContent = `
        .guides-ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: guides-ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes guides-ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyles);

    // Configurar filtros avanzados
    function setupAdvancedFilters() {
        const advancedFiltersToggle = document.querySelector('.guides-filters-toggle');
        const advancedFiltersSection = document.getElementById('guidesAdvancedFilters');
        
        if (advancedFiltersToggle && advancedFiltersSection) {
            advancedFiltersToggle.addEventListener('click', function() {
                const isVisible = advancedFiltersSection.style.display !== 'none';
                
                if (isVisible) {
                    advancedFiltersSection.style.animation = 'slideUp 0.3s ease-out';
                    setTimeout(() => {
                        advancedFiltersSection.style.display = 'none';
                    }, 300);
                    this.innerHTML = '<i class="fas fa-cog"></i> Filtros Avanzados';
                } else {
                    advancedFiltersSection.style.display = 'block';
                    advancedFiltersSection.style.animation = 'slideDown 0.3s ease-out';
                    this.innerHTML = '<i class="fas fa-times"></i> Ocultar Filtros';
                }
            });
        }
    }
    
    // Configurar búsqueda en tiempo real
    function setupRealTimeSearch() {
        const searchInput = document.getElementById('guidesSearchInput');
        const topicFilter = document.getElementById('guidesTopicFilter');
        const dateFromFilter = document.getElementById('guidesDateFrom');
        const dateToFilter = document.getElementById('guidesDateTo');
        const viewsMinFilter = document.getElementById('guidesViewsMin');
        const viewsMaxFilter = document.getElementById('guidesViewsMax');
        const authorFilter = document.getElementById('guidesAuthorFilter');
        
        // Función de filtrado principal
        function filterGuides() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const selectedTopic = topicFilter ? topicFilter.value : '';
            const dateFrom = dateFromFilter ? new Date(dateFromFilter.value) : null;
            const dateTo = dateToFilter ? new Date(dateToFilter.value) : null;
            const viewsMin = viewsMinFilter ? parseInt(viewsMinFilter.value) || 0 : 0;
            const viewsMax = viewsMaxFilter ? parseInt(viewsMaxFilter.value) || Infinity : Infinity;
            const selectedAuthor = authorFilter ? authorFilter.value : '';

            const selectedTopicNorm = (selectedTopic || '').toLowerCase().trim();
            const selectedAuthorNorm = (selectedAuthor || '').toLowerCase().trim();
            
            const tableRows = document.querySelectorAll('.guides-table tbody tr[data-guide-id]');
            let visibleCount = 0;
            
            tableRows.forEach(row => {
                const titleElement = row.querySelector('.guides-title-link');
                const topicElement = row.querySelector('.guides-category-badge');
                const authorElement = row.querySelector('.guides-author-name');
                const dateElement = row.querySelector('.guides-date-main');
                const viewsElement = row.querySelector('.guides-stat-item span');
                
                const title = titleElement ? titleElement.textContent.toLowerCase() : '';
                const topic = topicElement ? topicElement.textContent : '';
                const author = authorElement ? authorElement.textContent : '';
                const topicNorm = (topic || '').toLowerCase().trim();
                const authorNorm = (author || '').toLowerCase().trim();
                const dateText = dateElement ? dateElement.textContent : '';
                const views = viewsElement ? parseInt(viewsElement.textContent) || 0 : 0;
                
                // Aplicar filtros
                let shouldShow = true;
                
                // Filtro de búsqueda
                if (searchTerm && !title.includes(searchTerm) && !author.toLowerCase().includes(searchTerm)) {
                    shouldShow = false;
                }
                
                // Filtro de tema
                if (selectedTopicNorm && selectedTopicNorm !== 'all' && topicNorm !== selectedTopicNorm) {
                    shouldShow = false;
                }
                
                // Filtro de autor
                if (selectedAuthorNorm && authorNorm !== selectedAuthorNorm) {
                    shouldShow = false;
                }
                
                // Filtro de vistas
                if (views < viewsMin || views > viewsMax) {
                    shouldShow = false;
                }
                
                // Filtro de fecha
                if (dateFrom || dateTo) {
                    const rowDate = new Date(dateText);
                    if (dateFrom && rowDate < dateFrom) shouldShow = false;
                    if (dateTo && rowDate > dateTo) shouldShow = false;
                }
                
                // Mostrar/ocultar fila con animación
                if (shouldShow) {
                    row.style.display = '';
                    row.style.animation = 'fadeInUp 0.3s ease-out';
                    visibleCount++;
                } else {
                    row.style.animation = 'fadeOut 0.3s ease-out';
                    setTimeout(() => {
                        row.style.display = 'none';
                    }, 300);
                }
            });
            
            // Mostrar mensaje si no hay resultados
            updateEmptyState(visibleCount === 0);
        }
        
        // Agregar event listeners
        if (searchInput) {
            searchInput.addEventListener('input', debounce(filterGuides, 300));
        }
        
        [topicFilter, dateFromFilter, dateToFilter, viewsMinFilter, viewsMaxFilter, authorFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', filterGuides);
            }
        });
        
        // Hacer la función global para uso en EJS
        window.filterGuides = function(){ filterGuides(); renderGuidesPagination(); applyGuidesPage(); };
        renderGuidesPagination();
        applyGuidesPage();
    }
    
    // Función para mostrar/ocultar filtros avanzados (global para EJS)
    window.toggleAdvancedFilters = function() {
        const advancedFiltersSection = document.getElementById('guidesAdvancedFilters');
        const toggleButton = document.querySelector('.guides-filters-toggle');
        
        if (advancedFiltersSection && toggleButton) {
            const isVisible = advancedFiltersSection.style.display !== 'none';
            
            if (isVisible) {
                advancedFiltersSection.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => {
                    advancedFiltersSection.style.display = 'none';
                }, 300);
                toggleButton.innerHTML = '<i class="fas fa-cog"></i> Filtros Avanzados';
            } else {
                advancedFiltersSection.style.display = 'block';
                advancedFiltersSection.style.animation = 'slideDown 0.3s ease-out';
                toggleButton.innerHTML = '<i class="fas fa-times"></i> Ocultar Filtros';
            }
        }
    };
    
    // Función para mostrar tutorial de guías (global para EJS)
    window.showGuidesTutorial = function() {
        // Crear modal de tutorial
        const tutorialModal = document.createElement('div');
        tutorialModal.className = 'guides-tutorial-modal';
        tutorialModal.innerHTML = `
            <div class="guides-tutorial-content">
                <div class="guides-tutorial-header">
                    <h3><i class="fas fa-graduation-cap"></i> Tutorial de Administración de Guías</h3>
                    <button onclick="closeTutorialModal()" class="guides-tutorial-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="guides-tutorial-body">
                    <div class="guides-tutorial-step">
                        <div class="guides-tutorial-step-number">1</div>
                        <div class="guides-tutorial-step-content">
                            <h4>Crear una Nueva Guía</h4>
                            <p>Haz clic en "Crear Guía" para comenzar a escribir una nueva guía psicológica.</p>
                        </div>
                    </div>
                    <div class="guides-tutorial-step">
                        <div class="guides-tutorial-step-number">2</div>
                        <div class="guides-tutorial-step-content">
                            <h4>Usar Filtros</h4>
                            <p>Utiliza los filtros para encontrar guías específicas por tema, autor o fecha.</p>
                        </div>
                    </div>
                    <div class="guides-tutorial-step">
                        <div class="guides-tutorial-step-number">3</div>
                        <div class="guides-tutorial-step-content">
                            <h4>Gestionar Contenido</h4>
                            <p>Edita, elimina o destaca guías usando los botones de acción en cada fila.</p>
                        </div>
                    </div>
                </div>
                <div class="guides-tutorial-footer">
                    <button onclick="closeTutorialModal()" class="guides-btn guides-btn-primary">
                        <i class="fas fa-check"></i> Entendido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(tutorialModal);
        
        // Mostrar modal con animación
        setTimeout(() => {
            tutorialModal.classList.add('show');
        }, 10);
    };
    
    // Función para cerrar modal de tutorial
    window.closeTutorialModal = function() {
        const modal = document.querySelector('.guides-tutorial-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    };
    
    // Función debounce para optimizar búsqueda
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Actualizar estado vacío
    function updateEmptyState(isEmpty) {
        const emptyState = document.querySelector('.guides-empty-state');
        const tableBody = document.querySelector('.guides-table tbody');
        
        if (isEmpty && !emptyState && tableBody) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'guides-empty-state';
            emptyRow.innerHTML = `
                <td colspan="7" class="guides-empty-state">
                    <div class="guides-empty-content">
                        <div class="guides-empty-illustration">
                            <div class="guides-empty-circle">
                                <i class="fas fa-search guides-empty-icon"></i>
                            </div>
                        </div>
                        <h3>No se encontraron guías</h3>
                        <p>Intenta ajustar los filtros de búsqueda para encontrar las guías que buscas.</p>
                        <button onclick="clearAllFilters()" class="guides-btn guides-btn-secondary">
                            <i class="fas fa-refresh"></i>
                            Limpiar Filtros
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(emptyRow);
        } else if (!isEmpty && emptyState) {
            emptyState.remove();
        }
    }
    
    // Función para limpiar todos los filtros
    window.clearAllFilters = function() {
        const searchInput = document.getElementById('guidesSearchInput');
        const topicFilter = document.getElementById('guidesTopicFilter');
        const dateFromFilter = document.getElementById('guidesDateFrom');
        const dateToFilter = document.getElementById('guidesDateTo');
        const viewsMinFilter = document.getElementById('guidesViewsMin');
        const viewsMaxFilter = document.getElementById('guidesViewsMax');
        const authorFilter = document.getElementById('guidesAuthorFilter');
        
        [searchInput, topicFilter, dateFromFilter, dateToFilter, viewsMinFilter, viewsMaxFilter, authorFilter].forEach(filter => {
            if (filter) {
                filter.value = '';
            }
        });
        
        // Mostrar todas las filas
        const tableRows = document.querySelectorAll('.guides-table tbody tr[data-guide-id]');
        tableRows.forEach(row => {
            row.style.display = '';
            row.style.animation = 'fadeInUp 0.3s ease-out';
        });
        
        // Remover estado vacío si existe
        updateEmptyState(false);
    };

    // Funciones del modal para crear guías
    function initializeGuideModal() {
        const modal = document.getElementById('guideModal');
        const form = document.getElementById('guideForm');
        const imageInput = document.getElementById('guideImage');
        const pdfInput = document.getElementById('guidePdf');
        const imagePreview = document.getElementById('imagePreview');
        const pdfPreview = document.getElementById('pdfPreview');
        
        // Manejar preview de archivos
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                handleFilePreview(e.target, imagePreview, 'image');
            });
        }
        
        if (pdfInput) {
            pdfInput.addEventListener('change', function(e) {
                handleFilePreview(e.target, pdfPreview, 'pdf');
            });
        }
        
        // Cerrar modal al hacer clic fuera
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeGuideModal();
                }
            });
        }
        
        // Manejar envío del formulario
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                submitGuideForm();
            });
        }
    }
    
    function handleFilePreview(input, previewElement, type) {
        const file = input.files[0];
        if (file) {
            const fileName = file.name;
            const fileSize = (file.size / 1024 / 1024).toFixed(2); // MB
            
            if (type === 'image') {
                previewElement.innerHTML = `
                    <i class="fas fa-image"></i>
                    <span>${fileName}</span>
                    <small>Tamaño: ${fileSize} MB</small>
                `;
            } else if (type === 'pdf') {
                previewElement.innerHTML = `
                    <i class="fas fa-file-pdf"></i>
                    <span>${fileName}</span>
                    <small>Tamaño: ${fileSize} MB</small>
                `;
            }
            
            previewElement.style.borderColor = 'var(--primary-guides)';
            previewElement.style.background = 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
        }
    }
    
    function submitGuideForm() {
        const form = document.getElementById('guideForm');
        const submitBtn = form.querySelector('.guide-btn-primary');
        
        // Mostrar estado de carga
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando...';
        submitBtn.disabled = true;
        
        // Enviar formulario
        const formData = new FormData(form);
        
        fetch('/guides/admin', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                // Éxito - recargar página o actualizar tabla
                window.location.reload();
            } else {
                throw new Error('Error al crear la guía');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al crear la guía. Por favor, inténtalo de nuevo.');
            
            // Restaurar botón
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Crear Guía';
            submitBtn.disabled = false;
        });
    }
    
    // Funciones globales para el modal
    window.openGuideModal = function() {
        const modal = document.getElementById('guideModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Enfocar el primer input
            setTimeout(() => {
                const firstInput = modal.querySelector('.guide-form-input');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        }
    };
    
    window.closeGuideModal = function() {
        const modal = document.getElementById('guideModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            // Limpiar formulario
            const form = document.getElementById('guideForm');
            if (form) {
                form.reset();
                
                // Restaurar previews
                const imagePreview = document.getElementById('imagePreview');
                const pdfPreview = document.getElementById('pdfPreview');
                
                if (imagePreview) {
                    imagePreview.innerHTML = `
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span>Arrastra una imagen o haz clic para seleccionar</span>
                        <small>Máximo 5MB - JPG, PNG, GIF</small>
                    `;
                    imagePreview.style.borderColor = '#D1FAE5';
                    imagePreview.style.background = 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)';
                }
                
                if (pdfPreview) {
                    pdfPreview.innerHTML = `
                        <i class="fas fa-file-pdf"></i>
                        <span>Selecciona el archivo PDF de la guía</span>
                        <small>Máximo 10MB - Solo archivos PDF</small>
                    `;
                    pdfPreview.style.borderColor = '#D1FAE5';
                    pdfPreview.style.background = 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)';
                }
            }
        }
    };
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('guideModal');
            if (modal && modal.classList.contains('show')) {
                closeGuideModal();
            }
        }
    });

    let guidesCurrentPage = 1;
    const guidesPageSize = 15;
    function getFilteredGuideRows(){
        const rows = Array.from(document.querySelectorAll('.guides-table tbody tr[data-guide-id]'));
        return rows.filter(r => r.style.display !== 'none');
    }
    function applyGuidesPage(){
        const rows = Array.from(document.querySelectorAll('.guides-table tbody tr[data-guide-id]'));
        const visible = getFilteredGuideRows();
        rows.forEach(r => { if (!visible.includes(r)) { r.style.display = 'none'; } });
        const start = (guidesCurrentPage-1)*guidesPageSize;
        const end = start + guidesPageSize;
        visible.forEach((r, idx) => { r.style.display = (idx>=start && idx<end) ? '' : 'none'; });
    }
    function renderGuidesPagination(){
        const container = document.getElementById('guidesPagination');
        if (!container) return;
        const total = getFilteredGuideRows().length;
        const pages = Math.max(1, Math.ceil(total / guidesPageSize));
        if (guidesCurrentPage > pages) guidesCurrentPage = pages;
        container.innerHTML = '';
        for(let i=1;i<=pages;i++){
            const btn = document.createElement('button');
            btn.className = 'page-btn'+(i===guidesCurrentPage?' active':'');
            btn.textContent = i;
            btn.onclick = function(){ guidesCurrentPage = i; applyGuidesPage(); renderGuidesPagination(); };
            container.appendChild(btn);
        }
    }

    // Exposer funciones globales si es necesario
    window.GuidesAdmin = {
        updateStats: updateStatistics,
        refreshData: updateGuidesData,
        exportData: exportGuidesData,
        state: GuidesState
    };

})();