# Asistente IA de BrainCare

Este es el componente de Inteligencia Artificial de BrainCare, que utiliza la API de Gemini para proporcionar respuestas a preguntas relacionadas con la psicología.

## Configuración

1. Asegúrate de tener Python instalado en tu sistema.

2. Instala las dependencias necesarias:

```bash
pip install flask flask-cors google-generativeai
```

O desde el directorio principal del proyecto:

```bash
npm run install-ia
```

3. La API key de Gemini ya está configurada en el archivo `app.py`. Si deseas usar tu propia API key, puedes modificarla directamente en el archivo o configurar una variable de entorno llamada `GEMINI_API_KEY`.

## Ejecución manual (si es necesario)

Normalmente, el servidor de IA se inicia automáticamente cuando inicias el servidor principal de BrainCare. Sin embargo, si necesitas iniciar el servidor de IA manualmente:

1. Navega al directorio `views/IA`
2. Ejecuta `python app.py`

El servidor de IA se ejecutará en `http://localhost:5000`.

## Uso

El asistente de IA está diseñado para responder preguntas relacionadas con la psicología. Está configurado para:

- Responder únicamente preguntas relacionadas con la psicología
- Mantener respuestas claras y breves
- Incluir una advertencia al final de cada respuesta

## Solución de problemas

Si encuentras el mensaje "Error al procesar la respuesta", verifica:

1. Que el servidor de IA esté en ejecución
2. Que la API key de Gemini sea válida
3. Que tengas conexión a Internet

Para más detalles sobre errores, revisa la consola del servidor.