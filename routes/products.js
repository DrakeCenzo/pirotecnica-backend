// routes/products.js  ← VERSIONE SEMPLICE E FUNZIONANTE AL 100%
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, restrictTo } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// GET tutti i prodotti
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'name email');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Solo admin o venditore
router.post('/', protect, restrictTo('admin', 'venditore'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    const product = new Product({
      name,
      description,
      price,
      category,
      image: req.file ? req.file.filename : null,
      seller: req.user._id
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Solo admin o proprietario
router.put('/:id', protect, restrictTo('admin', 'venditore'), upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Prodotto non trovato' });

    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    const { name, description, price, category } = req.body;
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    if (req.file) product.image = req.file.filename;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Solo admin o proprietario
router.delete('/:id', protect, restrictTo('admin', 'venditore'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Prodotto non trovato' });

    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Prodotto eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
