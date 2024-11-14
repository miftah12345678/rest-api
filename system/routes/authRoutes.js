const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const User = require('../models/user');

const router = express.Router();

// Twilio client setup
const twilioClient = twilio('AC8a38f7bd09083deb5d1a8743820d042c', '25235f45a51fdd014ea21119ee1f2225');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kiicodeofficial@gmail.com',
    pass: 'dbkzzhgtfrgrtonh'
  }
});

// Registration route
router.post('/register', async (req, res) => {
  const { username, email, password, phoneNumber } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 3600000; // 1 hour from now

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      apiKey: `KC-${crypto.randomBytes(8).toString('hex')}`,
      verificationToken,
      verificationExpires
    });

    await newUser.save();

    // Send verification email
    const verificationUrl = `http://${req.headers.host}/verify-email?token=${verificationToken}`;
    const mailOptions = {
      to: email,
      from: 'your-email@gmail.com',
      subject: 'Email Verification',
      text: `Please click the following link to verify your email: ${verificationUrl}`
    };

    await transporter.sendMail(mailOptions);

    // Send verification SMS (optional)
    // const smsMessage = `Please verify your account by clicking the following link: ${verificationUrl}`;
    // await twilioClient.messages.create({
    //   body: smsMessage,
    //   from: 'your-twilio-phone-number',
    //   to: phoneNumber
    // });

    res.status(200).json({ message: 'Registration successful. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Email verification route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Verification token is invalid or has expired' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error verifying email' });
  }
});

module.exports = router;
