document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('editar-perfil');
    const saveBtn = document.getElementById('guardar-cambios');
    const cancelBtn = document.getElementById('cancelar-edicion');
    const inputs = document.querySelectorAll('.profile-form input');
    const originalValues = {};

    inputs.forEach(input => {
        originalValues[input.name] = input.value;
    });

    editBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            input.removeAttribute('readonly');
        });
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
    });

    cancelBtn.addEventListener('click', () => {
        inputs.forEach(input => {
            input.value = originalValues[input.name] || '';
            input.setAttribute('readonly', true);
        });
        editBtn.style.display = 'inline-block';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    });
});