// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, restrictTo } = require('../middleware/auth');

// routes/orders.js (aggiornato)
router.post('/checkout', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Il carrello è vuoto' });
    }
    const total = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const order = new Order({
      user: userId,
      items: cart.items,
      total,
      status: 'In attesa'
    });
    await order.save();
    // Invia email all'admin
    const itemsList = cart.items.map(item => `${item.product.name} (Quantità: ${item.quantity}, Prezzo: ${item.product.price.toFixed(2)} €)`).join('\n');
    await sendEmail(
      process.env.ADMIN_EMAIL,
      'Nuovo Ordine Creato',
      `Un nuovo ordine è stato creato:\nUtente ID: ${userId}\nTotale: ${total.toFixed(2)} €\nProdotti:\n${itemsList}`
    );
    cart.items = [];
    await cart.save();
    res.status(201).json({ message: 'Ordine creato con successo', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ottieni ordini dell'utente
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ottieni tutti gli ordini (solo admin)
router.get('/all', protect, restrictTo('admin'), async (req, res) => {
  try {
    const orders = await Order.find().populate('items.product user');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aggiorna stato ordine (solo admin)
router.put('/:id/status', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['In attesa', 'Spedito', 'Completato'].includes(status)) {
      return res.status(400).json({ message: 'Stato non valido' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Ordine non trovato' });
    }
    order.status = status;
    await order.save();
    res.json({ message: 'Stato ordine aggiornato', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
