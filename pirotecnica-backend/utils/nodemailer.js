// utils/nodemailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Ignora certificati auto-firmati (solo per sviluppo)
  },
});

const sendRegistrationEmail = async (user) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Nuova Registrazione Utente - Pirotecnica Posca',
    html: `
      <h2>Nuova Registrazione</h2>
      <p>Un nuovo utente si è registrato su Pirotecnica Posca:</p>
      <ul>
        <li><strong>Nome:</strong> ${user.name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Ruolo:</strong> ${user.role}</li>
      </ul>
      <p>Accedi alla dashboard admin per gestire l'utente.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email di registrazione inviata a ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Errore invio email registrazione:', error);
    throw new Error('Errore nell\'invio dell\'email di registrazione');
  }
};

const sendOrderEmail = async (order, user) => {
  const itemsList = order.items.map(item => `
    <li>${item.product.name} - Quantità: ${item.quantity} - Prezzo: ${item.product.price.toFixed(2)} €</li>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'Nuovo Ordine - Pirotecnica Posca',
    html: `
      <h2>Nuovo Ordine</h2>
      <p>Un nuovo ordine è stato effettuato da ${user.name} (${user.email}):</p>
      <ul>${itemsList}</ul>
      <p><strong>Totale:</strong> ${order.total.toFixed(2)} €</p>
      <p><strong>Stato:</strong> ${order.status}</p>
      <p>Accedi alla dashboard admin per gestire l'ordine.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email di ordine inviata a ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('Errore invio email ordine:', error);
    throw new Error('Errore nell\'invio dell\'email di ordine');
  }
};

module.exports = { sendRegistrationEmail, sendOrderEmail };

// utils/nodemailer.js
const sendResetPasswordEmail = async (user, resetLink) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Ripristina la tua password - Pirotecnica Posca',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #d4af37;">Ripristina Password</h2>
        <p>Ciao <strong>${user.name}</strong>,</p>
        <p>Hai richiesto di reimpostare la password per il tuo account.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background:#d4af37; color:white; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold;">
            Reimposta Password
          </a>
        </p>
        <p><small>Questo link scade tra <strong>1 ora</strong>.</small></p>
        <p><small>Se non hai richiesto tu questa operazione, ignora questa email.</small></p>
        <hr>
        <p style="font-size:12px; color:#999;">Pirotecnica Posca - Fuoco e Spettacolo</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email reset inviata a ${user.email}`);
  } catch (error) {
    console.error('Errore invio email reset:', error);
    throw new Error('Errore invio email');
  }
};

module.exports = { sendRegistrationEmail, sendOrderEmail, sendResetPasswordEmail };
