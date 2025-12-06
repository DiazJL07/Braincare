document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los botones de pestaña
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    // Añadir evento click a cada botón
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase 'active' de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Añadir clase 'active' al botón clickeado
            this.classList.add('active');
            
            // Mostrar el contenido correspondiente
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});