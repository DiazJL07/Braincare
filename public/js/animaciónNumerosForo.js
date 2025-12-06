function animateNumbers() {
    document.querySelectorAll('.stat-box h3').forEach(el => {
      const target = parseInt(el.textContent);
      const duration = 2000; // 2 segundos
      const stepTime = 20; // ms entre actualizaciones
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          clearInterval(timer);
          el.textContent = target;
          if (target === 1000) el.textContent += '';
        } else {
          el.textContent = Math.floor(current);
        }
      }, stepTime);
    });
  }
  
  
  window.addEventListener('load', animateNumbers);