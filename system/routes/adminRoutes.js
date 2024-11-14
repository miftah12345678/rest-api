const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { sendEmail } = require('../mailer');

// Middleware untuk memastikan pengguna adalah admin
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.redirect('/auth/login');
}

// Halaman Send Email
router.get('/send-email', (req, res) => {
  res.render('send-email');
});

// Mengirim email
router.post('/send-email', async (req, res) => {
  const { email, subject, message } = req.body;
  try {
    await sendEmail(email, subject, message);
    res.redirect('/send-email?success=true');
  } catch (error) {
    console.error('Error sending email:', error);
    res.redirect('/send-email?error=true');
  }
});

module.exports = router;
