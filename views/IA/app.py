from flask import Flask, request, jsonify, session
from flask_cors import CORS
import google.generativeai as genai
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

app = Flask(__name__)
CORS(app, supports_credentials=True)  # Para permitir peticiones desde frontend con credenciales

# Configuración de sesión
app.config['SECRET_KEY'] = os.getenv("FLASK_SECRET_KEY", "braincare_ia_secret")

# Almacenamiento de conversaciones
conversations = {}

# CONFIGURA TU API KEY AQUÍ
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
model = None
if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
    model = genai.GenerativeModel("gemini-2.5-flash")

@app.route('/')
def root():
    return jsonify({"status": "ok", "service": "braincare-ia", "model_ready": bool(model)})

# Función para obtener o crear una conversación, aislada por usuario+sesión
def get_or_create_conversation(session_id, user_id):
    key = f"{user_id or 'anon'}:{session_id}"
    if key not in conversations:
        conversations[key] = {
            "history": [],
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "session_id": session_id,
            "user_id": user_id or 'anon'
        }
    return conversations[key]

@app.route('/api/gemini', methods=['POST'])
def chat():
    data = request.json
    user_prompt = data.get("prompt")
    if not user_prompt:
        return jsonify({"error": "Falta el prompt"}), 400
    
    # Obtener identificadores
    session_id = request.headers.get('X-Session-ID')
    user_id = request.headers.get('X-User-ID') or 'anon'
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Obtener o crear conversación
    conversation = get_or_create_conversation(session_id, user_id)
    
    # Añadir mensaje del usuario al historial
    conversation["history"].append({"role": "user", "content": user_prompt, "timestamp": datetime.now().isoformat()})
    conversation["last_updated"] = datetime.now().isoformat()
    
    # Construir el contexto de la conversación para el modelo
    conversation_context = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation["history"]])
    
    system_prompt = """Eres un asistente psicológico amigable y empático llamado Cokie. 
    Responde únicamente preguntas relacionadas con la psicología (salud mental, emociones, terapia, trastornos psicológicos, autoestima, relaciones interpersonales, etc.).
    
    Usa un tono conversacional, cálido y empático, como un psicólogo real hablando con un paciente.
    No saludes en cada mensaje, a menos que sea el primer mensaje ABSOLUTO de la conversación (es decir, cuando el historial de conversación está vacío). No incluyas frases como "ahora" o "hoy" en tu saludo inicial.
    Incluye emojis apropiados para hacer la conversación más amigable (1-2 por respuesta).
    Personaliza tus respuestas basándote en el historial de la conversación.
    Mantén las respuestas claras y concisas (máximo 4-5 oraciones).
    
    Si la pregunta no está relacionada con la psicología, indica amablemente que solo puedes responder sobre temas de psicología.
    
    Incluye la advertencia 'Esta información tiene fines orientativos, pero lo más recomendable es consultar a un profesional de la salud mental para recibir apoyo adecuado.' solo y exclusivamente cuando des consejos específicos o recomendaciones directas sobre salud mental. No la incluyas en respuestas generales o informativas.""" 
    
    full_prompt = f"{system_prompt}\n\nHistorial de conversación:\n{conversation_context}\n\nResponde al último mensaje del usuario de manera conversacional:"

    if not model:
        return jsonify({"error": "IA no configurada"}), 503
    try:
        response = model.generate_content(full_prompt)
        
        # Añadir respuesta al historial
        conversation["history"].append({"role": "assistant", "content": response.text, "timestamp": datetime.now().isoformat()})
    
        return jsonify({
            "response": response.text,
            "session_id": session_id,
            "conversation": conversation
    })
    except Exception as e:
        print(f"Error al generar respuesta: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/conversation', methods=['GET'])
def get_conversation():
    session_id = request.headers.get('X-Session-ID')
    user_id = request.headers.get('X-User-ID') or 'anon'
    if not session_id:
        return jsonify({"error": "Conversación no encontrada"}), 404
    key = f"{user_id}:{session_id}"
    if key not in conversations:
        return jsonify({"error": "Conversación no encontrada"}), 404
    return jsonify(conversations[key])

@app.route('/api/conversation', methods=['DELETE'])
def clear_conversation():
    session_id = request.headers.get('X-Session-ID')
    user_id = request.headers.get('X-User-ID') or 'anon'
    if not session_id:
        return jsonify({"error": "ID de sesión no proporcionado"}), 400
    key = f"{user_id}:{session_id}"
    if key in conversations:
        conversations[key]["history"] = []
        conversations[key]["last_updated"] = datetime.now().isoformat()
    return jsonify({"success": True, "message": "Conversación borrada"})

if __name__ == '__main__':
    debug_flag = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(host='0.0.0.0', port=5001, debug=debug_flag)
