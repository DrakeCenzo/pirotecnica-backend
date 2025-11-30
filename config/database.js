// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connesso: ${conn.connection.host}`);
  } catch (error) {
    console.error('Errore connessione MongoDB:', error.message);
    process.exit(1); // ferma il server se non si connette
  }
};

module.exports = connectDB;
