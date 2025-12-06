// Animación de aparición al hacer scroll
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.animate-card, .stat-box');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(element => {
        observer.observe(element);
    });

    // Efecto hover mejorado para las tarjetas
    const cards = document.querySelectorAll('.popular-card, .category-card, .stat-box');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (this.classList.contains('stat-box')) {
                this.style.transform = 'scale(1.05)';
            } else {
                this.style.transform = 'translateY(-5px)';
            }
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Efecto para el buscador
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        const searchInput = searchBar.querySelector('input');
        searchInput.addEventListener('focus', function() {
            searchBar.style.transform = 'scale(1.02)';
        });
        searchInput.addEventListener('blur', function() {
            searchBar.style.transform = '';
        });
    }
});