document.addEventListener('DOMContentLoaded', function() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const saveButton = document.getElementById('save-changes');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const field = this.getAttribute('data-field');
            const input = document.getElementById(field);
            
            // Habilitar el campo para edición
            input.readOnly = false;
            input.focus();
            
            // Mostrar el botón de guardar
            saveButton.style.display = 'block';
        });
    });
    
    // También puedes añadir un evento para ocultar el botón de guardar si no hay cambios
    const formInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            saveButton.style.display = 'block';
        });
    });
});