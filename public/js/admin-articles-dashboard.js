// JavaScript para Dashboard de Administración de Artículos - Tema Psicología

// Configuración global para artículos
const ArticlesDashboard = {
    config: {
        animationDuration: 600,
        staggerDelay: 200,
        typewriterSpeed: 80,
        updateInterval: 30000,
        rippleSize: 300
    },
    state: {
        isLoading: false,
        currentSort: null,
        currentFilter: null,
        animationsEnabled: true
    }
};

// Inicialización del dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Inicializando Dashboard de Artículos...');
    
    // Inicializar todas las funcionalidades
    initializeArticlesAnimations();
    initializeArticlesEventListeners();
    initializeArticlesTypewriter();
    initializeArticlesRealTimeUpdates();
    initializeArticlesInteractivity();
    setupArticlesAdvancedFilters();
    setupArticlesRealTimeSearch();
    initializeArticleModal();
    if (typeof renderArticlesPagination === 'function') {
        renderArticlesPagination();
    }
    if (typeof applyArticlesPage === 'function') {
        applyArticlesPage();
    }
    
    console.log('✨ Dashboard de Artículos inicializado correctamente');
});

// Animaciones de entrada para elementos del dashboard
function initializeArticlesAnimations() {
    // Animación de entrada para tarjetas de estadísticas
    const statCards = document.querySelectorAll('.articles-stat-card');
    statCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px) scale(0.8) rotate(-5deg)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1) rotate(0deg)';
        }, index * ArticlesDashboard.config.staggerDelay);
    });
    
    // Animación de entrada para filas de la tabla
    const tableRows = document.querySelectorAll('.articles-table tbody tr');
    tableRows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-30px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, 800 + (index * 100));
    });
    
    // Animación para el contenedor principal
    const mainContent = document.querySelector('.articles-main-content');
    if (mainContent) {
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            mainContent.style.transition = 'all 1s cubic-bezier(0.4, 0, 0.2, 1)';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }, 400);
    }
}

// Event listeners para interactividad
function initializeArticlesEventListeners() {
    // Efecto ripple para botones de acción
    const actionButtons = document.querySelectorAll('.articles-action-btn, .articles-action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', createArticlesRippleEffect);
    });
    
    // Hover effects mejorados para tarjetas de estadísticas
    const statCards = document.querySelectorAll('.articles-stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', handleArticlesStatCardHover);
        card.addEventListener('mouseleave', handleArticlesStatCardLeave);
    });
    
    // Efectos de hover para filas de tabla
    const tableRows = document.querySelectorAll('.articles-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', handleArticlesTableRowHover);
        row.addEventListener('mouseleave', handleArticlesTableRowLeave);
    });
    
    // Inicializar filtros
    initializeFilters();
}
    
    // Función para inicializar los filtros
function initializeFilters() {
    // Asegurarse de que los selectores de filtro estén funcionando
    const topicFilter = document.getElementById('articlesTopicFilter');
    const authorFilter = document.getElementById('articlesAuthorFilter');
    
    if (topicFilter) {
        topicFilter.addEventListener('change', function() {
            filterArticles();
        });
    }
    
    if (authorFilter) {
        authorFilter.addEventListener('change', function() {
            filterArticles();
        });
    }
}

// Función para filtrar artículos
function filterArticles() {
    const searchInput = document.getElementById('articlesSearchInput');
    const topicFilter = document.getElementById('articlesTopicFilter');
    const authorFilter = document.getElementById('articlesAuthorFilter');
    const dateFrom = document.getElementById('articlesDateFrom');
    const dateTo = document.getElementById('articlesDateTo');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedTopic = topicFilter ? topicFilter.value : 'all';
    const selectedAuthor = authorFilter ? authorFilter.value : 'all';
    const fromDate = dateFrom && dateFrom.value ? new Date(dateFrom.value) : null;
    const toDate = dateTo && dateTo.value ? new Date(dateTo.value) : null;
    
    const rows = document.querySelectorAll('.articles-table tbody tr');
    
    rows.forEach(row => {
        if (row.classList.contains('articles-empty-state')) return;
        
        const title = row.querySelector('.articles-title-link')?.textContent.toLowerCase() || '';
        const topic = row.querySelector('.articles-category-badge')?.textContent.toLowerCase() || '';
        const author = row.querySelector('.articles-author-name')?.textContent.toLowerCase() || '';
        const dateText = row.querySelector('.articles-date-main')?.textContent || '';
        const date = dateText ? new Date(dateText) : null;
        
        // Aplicar filtros
        const matchesSearch = !searchTerm || title.includes(searchTerm);
        const matchesTopic = selectedTopic === 'all' || topic === selectedTopic.toLowerCase();
        const matchesAuthor = selectedAuthor === 'all' || author === selectedAuthor.toLowerCase();
        const matchesDateRange = (!fromDate || !date || date >= fromDate) && (!toDate || !date || date <= toDate);
        
        // Mostrar u ocultar fila según filtros
        if (matchesSearch && matchesTopic && matchesAuthor && matchesDateRange) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
  // Mostrar mensaje si no hay resultados
  const visibleRows = document.querySelectorAll('.articles-table tbody tr:not([style*="display: none"])');
  const emptyState = document.querySelector('.articles-empty-state');
  
  if (visibleRows.length === 0 && !emptyState) {
        const tbody = document.querySelector('.articles-table tbody');
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'articles-empty-state articles-filter-empty';
        emptyRow.innerHTML = `
            <td colspan="6">
                <div class="articles-empty-content">
                    <div class="articles-empty-illustration">
                        <div class="articles-empty-circle">
                            <i class="fas fa-search articles-empty-icon"></i>
                        </div>
                    </div>
                    <h3>No se encontraron resultados</h3>
                    <p>No hay artículos que coincidan con los criterios de búsqueda. Intenta con otros filtros.</p>
                    <button class="articles-btn articles-btn-secondary" onclick="resetFilters()">
                        <i class="fas fa-undo"></i>
                        Restablecer filtros
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(emptyRow);
    } else if (visibleRows.length > 0) {
      const filterEmpty = document.querySelector('.articles-filter-empty');
      if (filterEmpty) filterEmpty.remove();
    }

    // Reiniciar y aplicar paginación tras filtrar
    try {
        if (typeof articlesCurrentPage !== 'undefined') { articlesCurrentPage = 1; }
        if (typeof renderArticlesPagination === 'function') { renderArticlesPagination(); }
        if (typeof applyArticlesPage === 'function') { applyArticlesPage(); }
    } catch(_){}
}

// Función para restablecer filtros
function resetFilters() {
    const searchInput = document.getElementById('articlesSearchInput');
    const topicFilter = document.getElementById('articlesTopicFilter');
    const authorFilter = document.getElementById('articlesAuthorFilter');
    const dateFrom = document.getElementById('articlesDateFrom');
    const dateTo = document.getElementById('articlesDateTo');
    
    if (searchInput) searchInput.value = '';
    if (topicFilter) topicFilter.value = 'all';
    if (authorFilter) authorFilter.value = 'all';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    filterArticles();
    try {
        if (typeof articlesCurrentPage !== 'undefined') { articlesCurrentPage = 1; }
        if (typeof renderArticlesPagination === 'function') { renderArticlesPagination(); }
        if (typeof applyArticlesPage === 'function') { applyArticlesPage(); }
    } catch(_){}
}

// Manejadores para acciones de tabla
initializeArticlesTableActions();

// Efecto typewriter para el título
function initializeArticlesTypewriter() {
    const titleElement = document.querySelector('.articles-dashboard-header h1');
    if (!titleElement) return;
    
    const originalText = titleElement.textContent;
    titleElement.textContent = '';
    titleElement.style.borderRight = '3px solid white';
    
    let charIndex = 0;
    const typeInterval = setInterval(() => {
        if (charIndex < originalText.length) {
            titleElement.textContent += originalText.charAt(charIndex);
            charIndex++;
        } else {
            clearInterval(typeInterval);
            // Efecto de parpadeo del cursor
            setTimeout(() => {
                titleElement.style.borderRight = 'none';
            }, 1000);
        }
    }, ArticlesDashboard.config.typewriterSpeed);
}

// Sistema de actualizaciones en tiempo real
function initializeArticlesRealTimeUpdates() {
    const indicator = document.querySelector('.articles-real-time-indicator');
    const dot = document.querySelector('.articles-real-time-dot');
    
    if (!indicator || !dot) return;
    
    // Configurar actualizaciones periódicas
    setInterval(() => {
        updateArticlesStatistics();
    }, ArticlesDashboard.config.updateInterval);
    
    // Animación del indicador en tiempo real
    setInterval(() => {
        dot.style.transform = 'scale(1.5)';
        dot.style.boxShadow = '0 0 20px var(--primary-articles)';
        
        setTimeout(() => {
            dot.style.transform = 'scale(1)';
            dot.style.boxShadow = '0 0 10px var(--primary-articles)';
        }, 300);
    }, 2000);
}

// Actualizar estadísticas con animación
function updateArticlesStatistics() {
    const statNumbers = document.querySelectorAll('.articles-stat-number');
    
    // Simular actualización de datos (en producción, esto vendría de una API)
    statNumbers.forEach(numberElement => {
        const currentValue = parseInt(numberElement.textContent.replace(/,/g, ''));
        const newValue = currentValue + Math.floor(Math.random() * 5);
        
        animateArticlesNumber(numberElement, currentValue, newValue);
    });
    
    // Mostrar indicador de actualización
    showArticlesUpdateIndicator();
}

// Animación de números
function animateArticlesNumber(element, start, end) {
    const duration = 1000;
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function para suavidad
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(start + (end - start) * easeOutCubic);
        
        element.textContent = currentValue.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Mostrar indicador de actualización
function showArticlesUpdateIndicator() {
    const indicator = document.querySelector('.articles-real-time-indicator');
    if (!indicator) return;
    
    // Efecto de pulso
    indicator.style.transform = 'scale(1.1)';
    indicator.style.background = 'rgba(138, 43, 226, 0.2)';
    
    setTimeout(() => {
        indicator.style.transform = 'scale(1)';
        indicator.style.background = 'rgba(138, 43, 226, 0.1)';
    }, 500);
}

// Efecto ripple para botones
function createArticlesRippleEffect(e) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transform: scale(0);
        animation: articles-ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#articles-ripple-style')) {
        const style = document.createElement('style');
        style.id = 'articles-ripple-style';
        style.textContent = `
            @keyframes articles-ripple {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Hover effects para tarjetas de estadísticas
function handleArticlesStatCardHover(e) {
    const card = e.currentTarget;
    const icon = card.querySelector('.articles-stat-icon');
    
    card.style.transform = 'translateY(-15px) rotate(-2deg) scale(1.03)';
    
    if (icon) {
        icon.style.transform = 'scale(1.2) rotate(10deg)';
        icon.style.animation = 'none';
    }
    
    // Efecto de partículas
    createArticlesParticleEffect(card);
}

function handleArticlesStatCardLeave(e) {
    const card = e.currentTarget;
    const icon = card.querySelector('.articles-stat-icon');
    
    card.style.transform = 'translateY(0) rotate(0deg) scale(1)';
    
    if (icon) {
        icon.style.transform = 'scale(1) rotate(0deg)';
        icon.style.animation = 'float 4s ease-in-out infinite';
    }
}

// Efectos para filas de tabla
function handleArticlesTableRowHover(e) {
    const row = e.currentTarget;
    const titleLink = row.querySelector('.articles-title-link');
    const badge = row.querySelector('.articles-category-badge');
    
    if (titleLink) {
        titleLink.style.transform = 'translateY(-2px)';
    }
    
    if (badge) {
        badge.style.transform = 'scale(1.15) rotate(-2deg)';
    }
}

function handleArticlesTableRowLeave(e) {
    const row = e.currentTarget;
    const titleLink = row.querySelector('.articles-title-link');
    const badge = row.querySelector('.articles-category-badge');
    
    if (titleLink) {
        titleLink.style.transform = 'translateY(0)';
    }
    
    if (badge) {
        badge.style.transform = 'scale(1) rotate(0deg)';
    }
}

// Efecto de partículas para hover
function createArticlesParticleEffect(element) {
    const particles = 6;
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: linear-gradient(45deg, var(--primary-articles), var(--accent-articles));
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            animation: articles-particle-float 2s ease-out forwards;
        `;
        
        // Dirección aleatoria
        const angle = (i / particles) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        const endX = Math.cos(angle) * distance;
        const endY = Math.sin(angle) * distance;
        
        particle.style.setProperty('--end-x', endX + 'px');
        particle.style.setProperty('--end-y', endY + 'px');
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
    
    // Agregar animación CSS si no existe
    if (!document.querySelector('#articles-particle-style')) {
        const style = document.createElement('style');
        style.id = 'articles-particle-style';
        style.textContent = `
            @keyframes articles-particle-float {
                0% {
                    transform: translate(0, 0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--end-x), var(--end-y)) scale(0);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Acciones de tabla
function initializeArticlesTableActions() {
    // Botones de ver
    const viewButtons = document.querySelectorAll('.articles-btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', handleArticlesView);
    });
    
    // Botones de editar
    const editButtons = document.querySelectorAll('.articles-btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', handleArticlesEdit);
    });
    
    // Botones de eliminar
    const deleteButtons = document.querySelectorAll('.articles-btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleArticlesDelete);
    });
}

// Manejadores de acciones
function handleArticlesView(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const articleId = button.dataset.articleId;
    
    // Efecto visual
    button.style.transform = 'scale(1.3) rotate(360deg)';
    setTimeout(() => {
        button.style.transform = 'scale(1) rotate(0deg)';
        window.location.href = `/articles/${articleId}`;
    }, 400);
    
    console.log('👁️ Viendo artículo:', articleId);
}

function handleArticlesEdit(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const articleId = button.dataset.articleId;
    
    // Efecto visual
    button.style.transform = 'scale(1.3) rotate(-10deg)';
    setTimeout(() => {
        button.style.transform = 'scale(1) rotate(0deg)';
        window.location.href = `/articles/admin/${articleId}/edit`;
    }, 400);
    
    console.log('✏️ Editando artículo:', articleId);
}

function handleArticlesDelete(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const articleId = button.dataset.articleId;
    const articleTitle = button.dataset.articleTitle; // Assuming you add this data attribute
    
    confirmDeleteArticle(articleId, articleTitle);
}

// Sistema de notificaciones
function showArticlesNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `articles-notification articles-notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #4CAF50, #45a049)' : 'linear-gradient(135deg, var(--primary-articles), var(--secondary-articles))'};
        color: white;
        padding: 20px 30px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 600;
        font-size: 1rem;
        max-width: 350px;
        border: 3px solid rgba(255,255,255,0.3);
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}

// Funcionalidades adicionales de interactividad
function initializeArticlesInteractivity() {
    // Tooltips para botones de acción
    // initializeArticlesTooltips(); // Tooltips desactivados
    
    // Efectos de scroll
    initializeArticlesScrollEffects();
    
    // Mini gráficos en las estadísticas
    initializeArticlesMiniCharts();
}

// Sistema de tooltips
function initializeArticlesTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showArticlesTooltip);
        element.addEventListener('mouseleave', hideArticlesTooltip);
    });
}

function showArticlesTooltip(e) {
    const element = e.currentTarget;
    const text = element.dataset.tooltip;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'articles-tooltip';
    tooltip.style.cssText = `
        position: absolute;
        background: linear-gradient(135deg, var(--primary-articles), var(--secondary-articles));
        color: white;
        padding: 12px 18px;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(138, 43, 226, 0.4);
        border: 2px solid rgba(255,255,255,0.3);
        max-width: 200px;
        text-align: center;
    `;
    
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
    
    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
    }, 50);
    
    element._tooltip = tooltip;
}

function hideArticlesTooltip(e) {
    const element = e.currentTarget;
    const tooltip = element._tooltip;
    
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            tooltip.remove();
        }, 300);
        
        delete element._tooltip;
    }
}

// Efectos de scroll
function initializeArticlesScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar elementos que aparecen al hacer scroll
    const animatedElements = document.querySelectorAll('.articles-stat-card, .articles-table tbody tr');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Mini gráficos para estadísticas
function initializeArticlesMiniCharts() {
    const statCards = document.querySelectorAll('.articles-stat-card');
    
    statCards.forEach((card, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'articles-mini-chart';
        chartContainer.style.cssText = `
            width: 100%;
            height: 60px;
            margin-top: 20px;
            position: relative;
            overflow: hidden;
            border-radius: 10px;
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(147, 112, 219, 0.1));
        `;
        
        // Crear barras del mini gráfico
        for (let i = 0; i < 12; i++) {
            const bar = document.createElement('div');
            const height = Math.random() * 80 + 20;
            bar.style.cssText = `
                position: absolute;
                bottom: 0;
                left: ${i * 8}%;
                width: 6%;
                height: ${height}%;
                background: linear-gradient(to top, var(--primary-articles), var(--accent-articles));
                border-radius: 2px 2px 0 0;
                transition: all 0.3s ease;
                animation: articles-bar-grow 1s ease-out ${i * 0.1}s both;
            `;
            
            chartContainer.appendChild(bar);
        }
        
        card.appendChild(chartContainer);
    });
    
    // Agregar animación CSS para las barras
    if (!document.querySelector('#articles-chart-style')) {
        const style = document.createElement('style');
        style.id = 'articles-chart-style';
        style.textContent = `
            @keyframes articles-bar-grow {
                from {
                    height: 0;
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Función de utilidad para debugging
function debugArticlesDashboard() {
    console.log('🔍 Estado del Dashboard de Artículos:', {
        config: ArticlesDashboard.config,
        state: ArticlesDashboard.state,
        elements: {
            statCards: document.querySelectorAll('.articles-stat-card').length,
            tableRows: document.querySelectorAll('.articles-table tbody tr').length,
            actionButtons: document.querySelectorAll('.articles-action-button').length
        }
    });
}

// Configurar filtros avanzados para artículos
function setupArticlesAdvancedFilters() {
    const advancedFiltersToggle = document.querySelector('.articles-filters-toggle');
    const advancedFiltersSection = document.getElementById('articlesAdvancedFilters');
    
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

// Configurar búsqueda en tiempo real para artículos
 function setupArticlesRealTimeSearch() {
     const searchInput = document.getElementById('articlesSearchInput');
     const topicFilter = document.getElementById('articlesTopicFilter');
     
     const dateFromFilter = document.getElementById('articlesDateFrom');
     const dateToFilter = document.getElementById('articlesDateTo');
     const viewsMinFilter = document.getElementById('articlesViewsMin');
     const viewsMaxFilter = document.getElementById('articlesViewsMax');
     const authorFilter = document.getElementById('articlesAuthorFilter');
     
     // Función de filtrado principal
     function filterArticles() {
         const searchInput = document.getElementById('articlesSearchInput').value.toLowerCase();
         const topicFilter = document.getElementById('articlesTopicFilter').value;
         const authorFilter = document.getElementById('articlesAuthorFilter').value;
         const dateFrom = document.getElementById('articlesDateFrom').value;
         const dateTo = document.getElementById('articlesDateTo').value;
         const viewsMin = parseInt(document.getElementById('articlesViewsMin').value);
         const viewsMax = parseInt(document.getElementById('articlesViewsMax').value);
     
         const tableRows = document.querySelectorAll('.articles-table tbody tr');
     
         tableRows.forEach(row => {
             const title = row.querySelector('.articles-title-link').textContent.toLowerCase();
             const topic = row.querySelector('.articles-category-badge').textContent;
             const authorElement = row.querySelector('.articles-author-name');
             const author = authorElement ? authorElement.textContent : '';
             const publicationDate = new Date(row.querySelector('.articles-date-main').textContent);
             const views = parseInt(row.querySelector('.articles-stat-item span').textContent);
     
             const matchesSearch = title.includes(searchInput) || author.toLowerCase().includes(searchInput);
             const matchesTopic = topicFilter === 'all' || topic === topicFilter;
             const matchesAuthor = authorFilter === 'all' || author.trim().toLowerCase() === authorFilter.trim().toLowerCase();
             const matchesDate = (!dateFrom || publicationDate >= new Date(dateFrom)) && (!dateTo || publicationDate <= new Date(dateTo));
             const matchesViews = (!isNaN(viewsMin) ? views >= viewsMin : true) && (!isNaN(viewsMax) ? views <= viewsMax : true);
     
             if (matchesSearch && matchesTopic && matchesAuthor && matchesDate && matchesViews) {
                 row.style.display = '';
             } else {
                 row.style.display = 'none';
             }
         });
     }
     
        // Agregar event listeners
        if (searchInput) {
            searchInput.addEventListener('input', debounceArticles(filterArticles, 300));
        }
        
       [topicFilter, dateFromFilter, dateToFilter, viewsMinFilter, viewsMaxFilter, authorFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', filterArticles);
            }
        });
        
        // Hacer la función global para uso en EJS
        window.filterArticles = function(){ filterArticles(); renderArticlesPagination(); applyArticlesPage(); };
        renderArticlesPagination();
        applyArticlesPage();
     }

// Función para mostrar/ocultar filtros avanzados (global para EJS)
window.toggleArticlesAdvancedFilters = function() {
    const advancedFiltersSection = document.getElementById('articlesAdvancedFilters');
    const toggleButton = document.querySelector('.articles-filters-toggle');
    
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

// Función para mostrar tutorial de artículos (global para EJS)
window.showArticlesTutorial = function() {
    // Crear modal de tutorial
    const tutorialModal = document.createElement('div');
    tutorialModal.className = 'articles-tutorial-modal';
    tutorialModal.innerHTML = `
        <div class="articles-tutorial-content">
            <div class="articles-tutorial-header">
                <h3><i class="fas fa-graduation-cap"></i> Tutorial de Administración de Artículos</h3>
                <button onclick="closeArticlesTutorialModal()" class="articles-tutorial-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="articles-tutorial-body">
                <div class="articles-tutorial-step">
                    <div class="articles-tutorial-step-number">1</div>
                    <div class="articles-tutorial-step-content">
                        <h4>Crear un Nuevo Artículo</h4>
                        <p>Haz clic en "Crear Artículo" para comenzar a escribir un nuevo artículo psicológico.</p>
                    </div>
                </div>
                <div class="articles-tutorial-step">
                    <div class="articles-tutorial-step-number">2</div>
                    <div class="articles-tutorial-step-content">
                        <h4>Usar Filtros</h4>
                        <p>Utiliza los filtros para encontrar artículos específicos por tema, autor o fecha.</p>
                    </div>
                </div>
                <div class="articles-tutorial-step">
                    <div class="articles-tutorial-step-number">3</div>
                    <div class="articles-tutorial-step-content">
                        <h4>Gestionar Contenido</h4>
                        <p>Edita, elimina o destaca artículos usando los botones de acción en cada fila.</p>
                    </div>
                </div>
            </div>
            <div class="articles-tutorial-footer">
                <button onclick="closeArticlesTutorialModal()" class="articles-btn articles-btn-primary">
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
window.closeArticlesTutorialModal = function() {
    const modal = document.querySelector('.articles-tutorial-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

// Función debounce para optimizar búsqueda
function debounceArticles(func, wait) {
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
function updateArticlesEmptyState(isEmpty) {
    const emptyState = document.querySelector('.articles-empty-state');
    const tableBody = document.querySelector('.articles-table tbody');
    
    if (isEmpty && !emptyState && tableBody) {
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'articles-empty-state';
        emptyRow.innerHTML = `
            <td colspan="6" class="articles-empty-state">
                <div class="articles-empty-content">
                    <div class="articles-empty-illustration">
                        <div class="articles-empty-circle">
                            <i class="fas fa-search articles-empty-icon"></i>
                        </div>
                    </div>
                    <h3>No se encontraron artículos</h3>
                    <p>Intenta ajustar los filtros de búsqueda para encontrar los artículos que buscas.</p>
                    <button onclick="clearAllArticlesFilters()" class="articles-btn articles-btn-secondary">
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
window.clearAllArticlesFilters = function() {
    const searchInput = document.getElementById('articlesSearchInput');
    const topicFilter = document.getElementById('articlesTopicFilter');
    const dateFromFilter = document.getElementById('articlesDateFrom');
    const dateToFilter = document.getElementById('articlesDateTo');
    const viewsMinFilter = document.getElementById('articlesViewsMin');
    const viewsMaxFilter = document.getElementById('articlesViewsMax');
    const authorFilter = document.getElementById('articlesAuthorFilter');
    
    if (searchInput) searchInput.value = '';
    if (topicFilter) topicFilter.value = 'all';
    if (dateFromFilter) dateFromFilter.value = '';
    if (dateToFilter) dateToFilter.value = '';
    if (viewsMinFilter) viewsMinFilter.value = '';
    if (viewsMaxFilter) viewsMaxFilter.value = '';
    if (authorFilter) authorFilter.value = 'all';
    
    filterArticles(); // Re-apply filters after clearing
    
    // Remover estado vacío si existe
    updateArticlesEmptyState(false);
};

// Funciones para el Modal de Crear Artículo
function initializeArticleModal() {
    const fileInput = document.getElementById('articleImage');
    const form = document.getElementById('articleForm');
    
    if (fileInput) {
        fileInput.addEventListener('change', handleArticleFilePreview);
    }
    
    if (form) {
        form.addEventListener('submit', submitArticleForm);
    }
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeArticleModal();
        }
    });
}

function handleArticleFilePreview(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('articleImagePreview');
    
    if (file && preview) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="article-file-info">
                    <i class="fas fa-image"></i>
                    <span>${file.name}</span>
                    <small>(${(file.size / 1024 / 1024).toFixed(2)} MB)</small>
                </div>
                <img src="${e.target.result}" alt="Vista previa">
            `;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    } else if (preview) {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
}

async function submitArticleForm(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitArticleBtn');
    const form = e.target;
    const formData = new FormData(form);
    
    // Mostrar estado de carga
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/articles/admin', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            showArticlesNotification('Artículo creado exitosamente', 'success');
            closeArticleModal();
            // Recargar la página para mostrar el nuevo artículo
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            const errorData = await response.text();
            showArticlesNotification('Error al crear el artículo: ' + errorData, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showArticlesNotification('Error de conexión al crear el artículo', 'error');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Funciones globales para el modal
window.openArticleModal = function() {
    const modal = document.getElementById('articleModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        
        // Enfocar el primer campo
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }
};

window.closeArticleModal = function() {
    const modal = document.getElementById('articleModal');
    const form = document.getElementById('articleForm');
    const preview = document.getElementById('articleImagePreview');
    
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    // Limpiar formulario
    if (form) {
        form.reset();
    }
    
    // Limpiar vista previa
    if (preview) {
        preview.classList.remove('show');
        preview.innerHTML = '';
    }
};

// Exportar funciones para uso global
window.ArticlesDashboard = ArticlesDashboard;
window.debugArticlesDashboard = debugArticlesDashboard;
window.showArticlesNotification = showArticlesNotification;

console.log('📝 Dashboard de Artículos cargado correctamente');

let articlesCurrentPage = 1;
const articlesPageSize = 15;
function getFilteredArticleRows(){
  const rows = Array.from(document.querySelectorAll('.articles-table tbody tr'));
  return rows.filter(r => r.style.display !== 'none');
}
function applyArticlesPage(){
  const rows = Array.from(document.querySelectorAll('.articles-table tbody tr'));
  const visible = getFilteredArticleRows();
  rows.forEach(r => { if (!visible.includes(r)) { r.style.display = 'none'; } });
  const start = (articlesCurrentPage-1)*articlesPageSize;
  const end = start + articlesPageSize;
  visible.forEach((r, idx) => { r.style.display = (idx>=start && idx<end) ? '' : 'none'; });
}
function renderArticlesPagination(){
  const container = document.getElementById('articlesPagination');
  if (!container) return;
  const total = getFilteredArticleRows().length;
  const pages = Math.max(1, Math.ceil(total / articlesPageSize));
  if (articlesCurrentPage > pages) articlesCurrentPage = pages;
  container.innerHTML = '';
  for(let i=1;i<=pages;i++){
    const btn = document.createElement('button');
    btn.className = 'page-btn'+(i===articlesCurrentPage?' active':'');
    btn.textContent = i;
    btn.onclick = function(){ articlesCurrentPage = i; applyArticlesPage(); renderArticlesPagination(); };
    container.appendChild(btn);
  }
}