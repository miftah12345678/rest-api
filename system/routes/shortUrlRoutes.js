// system/routes/shortUrlRoutes.js
const express = require('express');
const crypto = require('crypto');
const Url = require('../models/url');
const router = express.Router();

// Route untuk membuat short URL
router.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;

  // Generate unique short URL
  const shortUrl = crypto.randomBytes(4).toString('hex');

  // Simpan ke database
  const newUrl = new Url({ originalUrl, shortUrl });
  await newUrl.save();

  res.json({ originalUrl, shortUrl: `${req.protocol}://${req.get('host')}/shorturl/${shortUrl}` });
});

// Route untuk redirect dari short URL ke original URL
router.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const url = await Url.findOne({ shortUrl });

  if (url) {
    res.redirect(url.originalUrl);
  } else {
    res.status(404).send('URL not found');
  }
});

module.exports = router;
