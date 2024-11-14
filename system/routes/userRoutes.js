const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user');
const { sendEmail } = require('../mailer');
const ensureAuthenticated = require('./ensureAuthenticated');

// Route to change API key (only for premium users)
router.post("/changeapikey", ensureAuthenticated, async (req, res) => {
  const { apikey } = req.body;
  if (!apikey) return res.json("error", "Masukan Apikey.");
  const user = req.user;
  const users = await User.findOne({ email: user.email });
  if (users.premium) {
    await User.updateOne({ email: user.email }, { apiKey: apikey });
    res.json("success", "Apikey berhasil di ubah.");
    res.redirect("/users/profile");
  } else {
    res.json("error", "Kamu Bukan User Premium.");
    res.redirect("/users/profile");
  }
});
// Route to check API key status
router.get('/cekapikey', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const apikey = req.query.apikey;
  res.json({
    apiKey: user.apiKey,
    premium: user.premium,
    limit: user.limit
  });
});

// Route to update user profile
router.post('/profile', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const { username, profile, apikey } = req.body;

  if (username) {
    user.username = username;
  }
  if (profile) {
    user.profile = profile;
  }
  if (apikey) {
    user.apiKey = apikey;
  }

  await user.save();
  
  res.json({ message: 'Profile updated successfully' });
});

// Route to upgrade to premium
router.post('/upgrade', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const { premiumDuration } = req.body; // Duration in seconds

  user.premium = true;
  user.premiumTime = Math.floor(Date.now() / 1000) + premiumDuration; // Set premium expiry time
  
  await user.save();

  // Send email notification
  const subject = 'Your Premium Subscription has Started';
  const text = `Hello ${user.username},\n\nYour premium subscription is now active for the next ${premiumDuration} seconds.\n\nBest regards,\nYour Company Name`;

  try {
    await sendEmail(user.email, subject, text);
    console.log(`Email sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
  }

  res.json({ message: 'User upgraded to premium successfully', premiumTime: user.premiumTime });
});

// Route untuk mengganti data pengguna
router.post('/update', ensureAuthenticated, async (req, res) => {
  const user = req.user;
  const { username, profile, apiKey } = req.body; // Dapatkan data yang dikirim oleh pengguna

  // Periksa apakah data yang diberikan oleh pengguna tidak kosong, jika tidak kosong, lakukan pembaruan
  if (username) {
    user.username = username;
  }
  if (profile) {
    user.profile = profile;
  }
  if (apiKey) {
    user.apiKey = apiKey;
  }

  // Simpan perubahan ke database
  try {
    await user.save();
    res.json({ message: 'User data updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user data' });
  }
});

// Route untuk mengubah username pengguna berdasarkan username saat ini
router.put('/changeusername', async (req, res) => {
  try {
    const { currentUsername, newUsername } = req.body; // Anggap saja body memiliki field "currentUsername" dan "newUsername"
    const user = await User.findOne({ username: currentUsername });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Periksa apakah username baru sudah digunakan oleh pengguna lain
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    user.username = newUsername; // Ubah username pengguna
    await user.save(); // Simpan perubahan ke dalam database
    res.json({ message: 'Username changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error wir' });
  }
});



module.exports = router;
