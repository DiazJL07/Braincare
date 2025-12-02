document.getElementById('chat-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  const prompt = document.getElementById('prompt').value;
  if (!prompt.trim()) {
    alert('Por favor, escribe una pregunta');
    return;
  }
  
  const responseContainer = document.getElementById('response-container');
  const chatBubble = document.getElementById('chat-bubble');
  const characterImage = document.getElementById('character-image');
  
  // Mostrar animación de pensando
  responseContainer.innerHTML = '<div class="thinking">Pensando<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></div>';
  chatBubble.classList.add('active');
  characterImage.classList.add('thinking');

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    
    if (data.error) {
      responseContainer.innerHTML = `<p class="error">Lo siento, ocurrió un error: ${data.error}</p>`;
      
      // Mostrar mensaje adicional si parece ser un problema de conexión con el servidor de IA
      if (data.error.includes('conectar con el servicio de IA')) {
        responseContainer.innerHTML += `
          <div class="server-error-info">
            <p>El servidor de IA parece no estar disponible. Posibles soluciones:</p>
            <ol>
              <li>Asegúrate de tener Python instalado en tu sistema</li>
              <li>Verifica que el servidor de IA esté en ejecución</li>
              <li>Contacta al administrador del sistema</li>
            </ol>
          </div>
        `;
      }
    } else {
      // Formatear la respuesta para mejor legibilidad
      const formattedResponse = data.response.replace(/\n/g, '<br>');
      responseContainer.innerHTML = `<p>${formattedResponse}</p>`;
    }
  } catch (error) {
    console.error('Error:', error);
    responseContainer.innerHTML = `
      <p class="error">Error al conectar con el servidor. Por favor, intenta de nuevo más tarde.</p>
      <div class="server-error-info">
        <p>Posibles causas:</p>
        <ul>
          <li>El servidor de IA no está en ejecución</li>
          <li>Problemas de conexión a Internet</li>
          <li>El servidor principal está experimentando problemas</li>
        </ul>
      </div>
    `;
  }
  
  // Quitar animación de pensando
  characterImage.classList.remove('thinking');
  
  // Limpiar el campo de entrada
  document.getElementById('prompt').value = '';
});
