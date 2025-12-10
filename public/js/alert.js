document.addEventListener('DOMContentLoaded', () => {
    const closeBtns = document.querySelectorAll('.close-alert');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.parentElement.style.display = 'none';
        });
    });

    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            alert.style.display = 'none';
        });
    }, 5000);
});