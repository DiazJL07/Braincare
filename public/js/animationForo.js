function handleImageAnimation() {
    const images = document.querySelectorAll('.MiniHead img');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    images.forEach(image => {
        observer.observe(image);
    });
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', handleImageAnimation);