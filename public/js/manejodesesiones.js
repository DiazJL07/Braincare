// Prevenir navegación con botón de retroceso después de cerrar sesión
window.addEventListener('pageshow', function(event) {
    // El evento persisted es true si la página se carga desde la caché del navegador
    if (event.persisted) {
        // Forzar una recarga completa de la página
        window.location.reload(true);
    }
});

// Código eliminado - interfería con la navegación normal
// Solo mantener prevención de caché para páginas después de logout

document.getElementById('toggle-form')?.addEventListener('click', function(event) {
    event.preventDefault();
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');

    if (registerForm.classList.contains('hidden')) {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        formTitle.textContent = 'Regístrate';
        formSubtitle.textContent = 'Crea una cuenta para comenzar';
    } else {
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        formTitle.textContent = 'Iniciar sesión';
        formSubtitle.textContent = 'Ingresa a tu cuenta';
    }
});