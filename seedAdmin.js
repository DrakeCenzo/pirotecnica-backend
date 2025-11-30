// seedAdmin.js
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connesso a MongoDB');

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (adminExists) {
      console.log('Admin già esistente:', adminExists.email);
      process.exit(0);
    }

    const admin = new User({
      name: 'Admin Pirotecnica',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD, // verrà hashato dal pre-save
      role: 'admin'
    });

    await admin.save();
    console.log('Admin creato con successo!');
    console.log('Email:', process.env.ADMIN_EMAIL);
    console.log('Password:', process.env.ADMIN_PASSWORD);
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error.message);
    process.exit(1);
  }
};

createAdmin();
