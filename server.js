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
const xss = require('xss');
const hpp = require('hpp');

dotenv.config();

const app = express();

// ==================== MIDDLEWARE BASE ====================
app.use(cors({
  origin: true,
  credentials: true
}));
console.log('CORS aperto per sviluppo locale');

app.use(helmet({
  contentSecurityPolicy: false  // per Tailwind CDN
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limit login
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: 'Troppi tentativi di login. Riprova tra 10 minuti.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// ==================== SICUREZZA (compatibile Node 22) ====================
app.use(mongoSanitize());
app.use(hpp());

// XSS solo su req.body → evita l'errore "getter only" di req.query
app.use((req, res, next) => {
  if (req.body) {
    const clean = (data) => {
      if (!data || typeof data !== 'object') return data;
      if (Array.isArray(data)) return data.map(clean);

      const cleaned = {};
      for (const key in data) {
        if (Object.hasOwnProperty.call(data, key)) {
          const value = data[key];
          cleaned[key] = typeof value === 'string'
            ? xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] })
            : clean(value);
        }
      }
      return cleaned;
    };
    req.body = clean(req.body);
  }
  next();
});

// ==================== DATABASE ====================
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

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({ message: 'Rotta non trovata' });
});

// ==================== GESTIONE ERRORI ====================
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
