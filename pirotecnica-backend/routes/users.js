// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// Ottieni tutti gli utenti (solo admin)
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggiorna ruolo utente (solo admin)
router.put('/:id/role', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['acquirente', 'venditore', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Ruolo non valido' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utente non trovato' });
    }
    user.role = role;
    await user.save();
    res.json({ message: 'Ruolo utente aggiornato', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
