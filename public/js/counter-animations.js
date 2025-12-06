// Script para prevenir redeclaración de variables de animación

// Prevenir redeclaración de lastCount
if (typeof lastCount === 'undefined') {
  var lastCount = null;
}

// Función global para animar contadores numéricos
function animateGlobalCounter(element, target, duration = 2000) {
  const increment = target / (duration / 16);
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current);
  }, 16);
}