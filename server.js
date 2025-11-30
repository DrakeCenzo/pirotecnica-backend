// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// Pacchetti sicurezza
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss');        // ← usiamo solo questo, come richiesto
const hpp = require('hpp');

// Carica variabili d'ambiente
dotenv.config();

const app = express();

// ==================== MIDDLEWARE BASE ====================
app.use(cors({
  origin: true,
  credentials: true
}));
console.log('CORS aperto per sviluppo locale');

app.use(helmet({
  contentSecurityPolicy: false  // necessario per Tailwind CDN
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cartella uploads pubblica
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limit solo sul login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minuti
  max: 10,
  message: { message: 'Troppi tentativi di login. Riprova tra 10 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// ==================== SICUREZZA (con solo "xss") ====================
app.use(mongoSanitize());
app.use(hpp());

// Middleware XSS personalizzato (pulisce body, query e params)
app.use((req, res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(clean);

    const cleaned = {};
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          cleaned[key] = xss(value, {
            whiteList: {},
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script']
          });
        } else {
          cleaned[key] = clean(value);
        }
      }
    }
    return cleaned;
  };

  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);

  next();
});

// ==================== CONNESSIONE DATABASE ====================
connectDB();

// ==================== ROTTE ====================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/licenses', require('./routes/licenses'));

// Test rapido
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Pirotecnica Posca Backend ONLINE e SICURO!',
    data: new Date().toLocaleString('it-IT'),
    env: process.env.NODE_ENV || 'development'
  });
});

// ==================== 404 – VERSIONE SICURA PER NODE 22+ ====================
app.use((req, res) => {
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
