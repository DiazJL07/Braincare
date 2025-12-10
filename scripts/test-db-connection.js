const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || process.env.DATABASE_URL || process.env.URL;
  if (!uri) {
    console.error('Sin URI de MongoDB en variables de entorno (MONGO_URI/DATABASE_URL/URL)');
    process.exit(1);
  }
  try {
    console.log('Intentando conectar a MongoDB...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Conexión exitosa a MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('Fallo de conexión a MongoDB:');
    console.error(err.name + ': ' + err.message);
    if (err.reason && err.reason.code) {
      console.error('Código: ' + err.reason.code);
    }
    process.exit(1);
  }
}

main();
