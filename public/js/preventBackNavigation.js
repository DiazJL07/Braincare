/**
 * Script para prevenir la navegación con el botón de retroceso después de cerrar sesión
 * Este script detecta si la página se está cargando desde la caché y fuerza una recarga
 */

(function() {
  // Verificar si la página se está cargando desde la caché
  window.addEventListener('pageshow', function(event) {
    // El evento persisted es true si la página se carga desde la caché del navegador
    if (event.persisted) {
      // Forzar una recarga completa de la página
      window.location.reload(true);
    }
  });

  // Deshabilitar el botón de retroceso
  window.history.pushState(null, null, window.location.href);
  window.onpopstate = function() {
    window.history.pushState(null, null, window.location.href);
  };
})();