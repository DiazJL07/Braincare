const mongoose = require('mongoose');
const Topic = require('../models/Topic');

// Conectar a la base de datos
mongoose.connect('mongodb://localhost:27017/braincare')
  .then(async () => {
    console.log('Conexión a MongoDB establecida');
    
    // Temas de ejemplo para el foro
    const topics = [
      { name: 'Salud Mental', description: 'Discusiones sobre salud mental, bienestar emocional y psicológico.' },
      { name: 'Nutrición', description: 'Temas relacionados con alimentación saludable y nutrición.' },
      { name: 'Ejercicio', description: 'Rutinas de ejercicio, fitness y actividad física.' },
      { name: 'Meditación', description: 'Técnicas de meditación, mindfulness y relajación.' },
      { name: 'Sueño', description: 'Consejos para mejorar la calidad del sueño y descanso.' },
      { name: 'Estrés', description: 'Manejo del estrés y técnicas de afrontamiento.' },
      { name: 'Relaciones', description: 'Relaciones interpersonales, familia y amistades.' },
      { name: 'Trabajo', description: 'Balance vida-trabajo y bienestar laboral.' },
      { name: 'Otros', description: 'Otros temas relacionados con el bienestar.' }
    ];
    
    // Eliminar temas existentes (opcional)
    await Topic.deleteMany({});
    console.log('Temas anteriores eliminados');
    
    // Crear nuevos temas
    const createdTopics = await Topic.insertMany(topics);
    console.log(`${createdTopics.length} temas creados exitosamente:`);
    createdTopics.forEach(topic => console.log(`- ${topic.name}`));
    
    // Cerrar conexión
    mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada');
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });