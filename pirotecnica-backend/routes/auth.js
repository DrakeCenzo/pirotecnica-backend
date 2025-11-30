// routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect, restrictTo } = require('../middleware/auth');

// ==================== REGISTER ====================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, hasLicense, licenseType, licenseNumber, licenseExpiry } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email già registrata' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let role = 'acquirente';
    let license = null;
    let licenseApproved = true;

    if (hasLicense === 'yes') {
      role = 'venditore';
      licenseApproved = false;
      license = { type: licenseType, number: licenseNumber, expiry: licenseExpiry };
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      license,
      licenseApproved
    });

    await user.save();

    if (licenseApproved) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(201).json({
        token,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }

    res.status(201).json({ message: 'Registrazione completata. Attendi approvazione licenza.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore server' });
  }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Credenziali non valide' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Credenziali non valide' });

    if (user.role === 'venditore' && !user.licenseApproved) {
      return res.status(403).json({ message: 'Account in attesa di approvazione licenza' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// ==================== PROFILO ====================
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

// ==================== ADMIN: utenti in attesa licenza ====================
router.get('/pending-licenses', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'venditore', licenseApproved: false })
      .select('name email license');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Errore server' });
  }
});

// ==================== ADMIN: approva licenza ====================
router.put('/approve-license/:id', protect, protect, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'venditore') return res.status(404).json({ message: 'Utente non trovato' });

    user.licenseApproved = true;
    await user.save();
    res.json({ message: 'Licenza approvata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore' });
  }
});

router.put('/reject-license/:id', protect, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    user.role = 'acquirente';
    user.license = null;
    user.licenseApproved = false;
    await user.save();
    res.json({ message: 'Licenza rifiutata' });
  } catch (err) {
    res.status(500).json({ message: 'Errore' });
  }
});

// AGGIUNGI QUESTE DUE RIGHE QUI SOTTO:
module.exports = router;
