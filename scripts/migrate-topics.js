const mongoose = require('mongoose');
const Topic = require('../models/Topic');
const Foro = require('../models/Foro');
require('dotenv').config();

async function migrateTopic() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Crear los temas iniciales
    const initialTopics = [
      {
        name: 'Ansiedad',
        description: 'Comparte experiencias, técnicas de manejo y apoyo relacionado con la ansiedad',
        isActive: true,
        createdBy: null
      },
      {
        name: 'Depresión',
        description: 'Espacio seguro para hablar sobre depresión, tratamientos y recuperación',
        isActive: true,
        createdBy: null
      },
      {
        name: 'Estrés',
        description: 'Estrategias para manejar el estrés diario y situaciones estresantes',
        isActive: true,
        createdBy: null
      }
    ];

    // Primero crear todos los temas
    const topicMap = {};
    for (const topicData of initialTopics) {
      let topic = await Topic.findOne({ name: topicData.name });
      if (!topic) {
        topic = await Topic.create(topicData);
        console.log(`Tema creado: ${topic.name} (ID: ${topic._id})`);
      } else {
        console.log(`El tema ${topic.name} ya existe (ID: ${topic._id})`);
      }
      topicMap[topicData.name] = topic._id;
    }

    // Ahora migrar los foros usando consultas directas de MongoDB
    const db = mongoose.connection.db;
    const foroCollection = db.collection('foros');
    
    for (const [topicName, topicId] of Object.entries(topicMap)) {
      const result = await foroCollection.updateMany(
        { topic: topicName },
        { $set: { topic: topicId } }
      );
      if (result.modifiedCount > 0) {
        console.log(`Migrados ${result.modifiedCount} foros al tema ${topicName}`);
      }
    }

    console.log('\n=== Migración completada ===');
    
    // Mostrar estadísticas
    const totalTopics = await Topic.countDocuments();
    const totalForos = await Foro.countDocuments();
    const forosWithTopicRef = await Foro.countDocuments({ topic: { $type: 'objectId' } });
    
    console.log(`Total de temas: ${totalTopics}`);
    console.log(`Total de foros: ${totalForos}`);
    console.log(`Foros migrados: ${forosWithTopicRef}`);
    
    if (forosWithTopicRef < totalForos) {
      console.log('\n⚠️  Advertencia: Algunos foros aún no han sido migrados.');
      const unmigrated = await Foro.find({ topic: { $not: { $type: 'objectId' } } });
      console.log('Foros sin migrar:');
      unmigrated.forEach(foro => {
        console.log(`- ${foro.title} (Tema: ${foro.topic})`);
      });
    }
    
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la migración
migrateTopic();