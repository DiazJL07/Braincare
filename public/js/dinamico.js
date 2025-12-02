document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".section");

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.6, // Activa el efecto cuando el 50% de la sección es visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Activar la sección actual
                entry.target.classList.add("active");
                // Desactivar las demás secciones
                sections.forEach((section) => {
                    if (section !== entry.target) {
                        section.classList.remove("active");
                    }
                });
            }
        });
    }, observerOptions);

    
    sections.forEach((section) => {
        observer.observe(section);
    });
});