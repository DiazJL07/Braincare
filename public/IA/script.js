// Variables globales
const iaContainerEl = document.querySelector('.ia-container');
const currentUserId = iaContainerEl ? iaContainerEl.dataset.userid : 'guest';
const storageKey = `brainbot_session_id_${currentUserId}`;
let sessionId = localStorage.getItem(storageKey) || null;
let conversation = [];

// Función para formatear la hora actual
function getCurrentTime() {
  const now = new Date();
  return now.getHours().toString().padStart(2, '0') + ':' + 
         now.getMinutes().toString().padStart(2, '0');
}

// Función para añadir un mensaje al chat
function addMessageToChat(content, sender) {
  const chatMessages = document.getElementById('chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender === 'user' ? 'user-message' : 'bot-message'}`;
  
  messageDiv.innerHTML = `
    <div class="message-content">
      <p>${content}</p>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll al último mensaje
}

// Función para mostrar indicador de "escribiendo..."
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message bot-message typing-indicator';
  typingDiv.id = 'typing-indicator';
  
  typingDiv.innerHTML = `
    <div class="message-content">
      <p><span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></p>
    </div>
  `;
  
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para eliminar indicador de "escribiendo..."
function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Función para cargar la conversación desde el servidor
async function loadConversation() {
  if (!sessionId) {
    try {
      sessionId = (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : (`s_${Date.now()}_${Math.floor(Math.random()*1e6)}`);
      localStorage.setItem(storageKey, sessionId);
    } catch (_) {
      sessionId = `s_${Date.now()}_${Math.floor(Math.random()*1e6)}`;
      localStorage.setItem(storageKey, sessionId);
    }
  }
  
  try {
    const res = await fetch('/api/conversation', {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      conversation = data.history || [];
      
      // Limpiar el chat actual
      document.getElementById('chat-messages').innerHTML = '';
      
      // Mostrar mensajes existentes
      if (conversation.length > 0) {
        conversation.forEach(msg => {
          addMessageToChat(msg.content, msg.role === 'user' ? 'user' : 'bot');
        });
      } else {
        // Si no hay conversación, mostrar mensaje de bienvenida
        const iaContainer = document.querySelector('.ia-container');
        const userName = iaContainer ? iaContainer.dataset.username : 'usuario';
        const welcomeMessage = `Hola ${userName}, ¿en qué puedo ayudarte hoy? 😊 Puedes preguntarme sobre temas de psicología, salud mental, emociones, terapia y más.`;
        addMessageToChat(welcomeMessage, 'bot');
      }
    } else if (res.status === 404) {
      document.getElementById('chat-messages').innerHTML = '';
      const iaContainer = document.querySelector('.ia-container');
      const userName = iaContainer ? iaContainer.dataset.username : 'usuario';
      const welcomeMessage = `Hola ${userName}, ¿en qué puedo ayudarte hoy? 😊 Puedes preguntarme sobre temas de psicología, salud mental, emociones, terapia y más.`;
      addMessageToChat(welcomeMessage, 'bot');
    }
  } catch (error) {
    console.error('Error al cargar la conversación:', error);
  }
}

// Función para borrar la conversación
async function clearConversation() {
  console.log('Attempting to clear conversation...', sessionId);
  if (!sessionId) {
    // Si no hay sesión, solo limpiamos la interfaz
    document.getElementById('chat-messages').innerHTML = '';
    const welcomeMessage = `¿En qué puedo ayudarte? 😊`;
    addMessageToChat(welcomeMessage, 'bot');
    return;
  }
  
  try {
    const res = await fetch('/api/conversation', {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      }
    });
    
    if (res.ok) {
      // Limpiar el chat actual
      document.getElementById('chat-messages').innerHTML = '';
      conversation = [];
      
      showCustomAlert('Conversación borrada.', 'success');
      // Mostrar mensaje de bienvenida
      const welcomeMessage = `¿En qué puedo ayudarte? 😊`;
      addMessageToChat(welcomeMessage, 'bot');
    }
  } catch (error) {
    console.error('Error al borrar la conversación:', error);
  }
}

// Función para manejar el envío de mensajes
async function sendMessage() {
  const promptInput = document.getElementById('prompt');
  const prompt = promptInput.value;
  const characterImage = document.getElementById('character-image');
  
  if (!prompt.trim()) {
    return; // No enviar mensajes vacíos
  }
  
  // Añadir mensaje del usuario al chat
  addMessageToChat(prompt, 'user');
  
  // Limpiar el campo de entrada
  promptInput.value = '';
  // Restaurar altura del textarea
  promptInput.style.height = 'auto';
  
  // Mostrar animación de pensando
  showTypingIndicator();
  characterImage.classList.add('thinking');

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    
    // Eliminar indicador de escribiendo
    removeTypingIndicator();
    
    if (data.error) {
      // Mostrar mensaje de error
      addMessageToChat(`Lo siento, ocurrió un error: ${data.error}`, 'bot');
      
      // Mostrar mensaje adicional si parece ser un problema de conexión con el servidor de IA
      if (data.error.includes('conectar con el servicio de IA')) {
        addMessageToChat(
          `El servidor de IA parece no estar disponible. Posibles soluciones:\n` +
          `1. Asegúrate de tener Python instalado en tu sistema\n` +
          `2. Verifica que el servidor de IA esté en ejecución\n` +
          `3. Contacta al administrador del sistema`, 
          'bot'
        );
      }
    } else {
      // Guardar el ID de sesión si es nuevo
      if (data.session_id && !sessionId) {
        sessionId = data.session_id;
        localStorage.setItem(storageKey, sessionId);
      }
      
      // Actualizar la conversación local
      if (data.conversation && data.conversation.history) {
        conversation = data.conversation.history;
      }
      
      // Añadir respuesta del bot al chat
      addMessageToChat(data.response, 'bot');
    }
  } catch (error) {
    console.error('Error:', error);
    removeTypingIndicator();
    addMessageToChat(
      `Error al conectar con el servidor. Por favor, intenta de nuevo más tarde.\n` +
      `Posibles causas:\n` +
      `• El servidor de IA no está en ejecución\n` +
      `• Problemas de conexión a Internet\n` +
      `• El servidor principal está experimentando problemas`, 
      'bot'
    );
  }
  
  // Quitar animación de pensando
  characterImage.classList.remove('thinking');
}

// Función para mostrar un alert personalizado
function showCustomAlert(message, type) {
  const alertContainer = document.getElementById('custom-alert-container');
  if (!alertContainer) {
    console.error('Custom alert container not found.');
    return;
  }

  const alertBox = document.createElement('div');
  alertBox.className = `custom-alert custom-alert-${type}`;
  alertBox.textContent = message;

  alertContainer.appendChild(alertBox);

  // Eliminar el alert después de unos segundos
  setTimeout(() => {
    alertBox.remove();
  }, 3000);
}

// Evento para enviar mensaje mediante el formulario
document.getElementById('chat-form').addEventListener('submit', function (e) {
  e.preventDefault();
  sendMessage();
});

// Evento para enviar mensaje al presionar Enter (sin Shift)
document.getElementById('prompt').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault(); // Prevenir salto de línea
    sendMessage();
  }
});

// Evento para ajustar automáticamente la altura del textarea
document.getElementById('prompt').addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});
  


  // Este código ya no es necesario porque se ha movido a la función sendMessage()

// Evento para borrar conversación
document.getElementById('clear-chat-btn').addEventListener('click', function() {
  clearConversation();
});

// Evento para mostrar información
document.getElementById('info-btn').addEventListener('click', function() {
  const infoModal = new bootstrap.Modal(document.getElementById('info-modal'));
  infoModal.show();
});

// Cargar conversación al iniciar
document.addEventListener('DOMContentLoaded', function() {
  loadConversation();
});

// Ajustar altura del textarea automáticamente
const promptTextarea = document.getElementById('prompt');
promptTextarea.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = (this.scrollHeight) + 'px';
});
