
// routes/licenses.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, restrictTo } = require('../middleware/auth');

// GET licenze non approvate (solo admin)
router.get('/', protect, restrictTo('admin'), async (req, res) => {
  try {
    const pendingLicenses = await User.find({ role: 'venditore', licenseApproved: false })
      .select('-password');
    res.json(pendingLicenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT approva licenza (solo admin)
router.put('/:id/approve', protect, restrictTo('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utente non trovato' });

    user.licenseApproved = true;
    await user.save();

    res.json({ message: 'Licenza approvata', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
