// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// ==================== CARICA VARIABILI D'AMBIENTE ====================
dotenv.config();

const app = express();

// ==================== CORS APERTO PER SVILUPPO LOCALE ====================
app.use(cors({
  origin: true,
  credentials: true
}));
console.log('CORS aperto per sviluppo locale');

// ==================== SICUREZZA E MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false  // necessario per Tailwind CDN
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cartella uploads pubblica (immagini prodotti)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Protezioni attacchi
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');
const hpp = require('hpp');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 10,
  message: { message: 'Troppi tentativi di login. Riprova tra 10 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// ==================== CONNESSIONE DATABASE ====================
connectDB();

// ==================== ROTTE – VERSIONE CHE FUNZIONA SEMPRE SU NODE 22 ====================
// Questa è la riga magica che risolve l'errore "got a Object"
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));   // ← FUNZIONA AL 100%

// ==================== TEST RAPIDO ====================
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Pirotecnica Posca Backend ONLINE e SICURO!',
    data: new Date().toLocaleString('it-IT'),
    env: process.env.NODE_ENV || 'development'
  });
});



// ==================== 404 ====================
app.all('*', (req, res) => {
  res.status(404).json({ message: 'Rotta non trovata' });
});

// ==================== GESTIONE ERRORI GLOBALE ====================
app.use((err, req, res, next) => {
  console.error('ERRORE:', err.message);
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Errore interno del server'
      : err.message
  });
});



// ==================== AVVIO SERVER ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\nPIROTECNICA POSCA - BACKEND ATTIVO`);
  console.log(`http://localhost:${PORT}`);
  console.log(`Test → http://localhost:${PORT}/api/test\n`);
});

app.use('/api/licenses', require('./routes/licenses'));
