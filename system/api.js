const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');
const path = require('path');
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const fileType = require('file-type');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const cheerio = require('cheerio');
const MakeMeAZombie = require('makemeazombie');
const zombie = new MakeMeAZombie();
const { request } = require('undici');
const WebSocket = require("ws");
const FormData = require("form-data");
const mesg = require('./mesg.js');
const User = require('./models/user'); // Assuming you have User model
const Url = require('./models/url');
const Function = require("./lib/function");
const { Saweria } = require('./lib/saweria');
const { tiktok, tiktoks, ttslide } = require("./scraper/scraper.js");
const { pinterest, pinterestdl, searchSpotify } = require("./scraper/pinterest.js");
const Func = new Function();
const BingImageCreator = require('./scraper/bingimg.js');
const { whois } = require('./scraper/tools.js');
const { blackbox, chatgpt, thinkany, askSimsimi } = require('./scraper/ai.js');
const { generate, elxyzFile } = require('./scraper/prodia.js');
const CarbonifyV2 = require('./scraper/canva.js');
const { ytmp4, capcut } = require('./scraper/downloader.js');
const { textpro2 } = require('./scraper/textpro');
const { checkQRISStatus, generateQRIS, createQRIS } = require('./scraper/orkut.js');
const { text2img } = require('./scraper/text2img.js');
const { tiktokStalk } = require('./scraper/stalk.js');
const { anichinSearch } = require('./scraper/anichin.js');
const { Buffer } = require('buffer');
const saweria = new Saweria();
const router = express.Router();
const requestIp = require('request-ip');
const sessionStore = {};
const d = new Date(new Date + 3600000)
const locale = 'id'
const jam = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
let hari = d.toLocaleDateString(locale, { weekday: 'long' })
const tgl = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Middleware to check API key and limits

const checkApiKey = async (req, res, next) => {
  const apiKey = req.query.apikey;
  if (!apiKey) {
    return res.json(Func.resValid({ error: 'Masukan Parameter Apikey.' }));
  }

  try {
    const user = await User.findOne({ apiKey });
    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if user is premium and within limit
    const currentDate = new Date();
    if (user.status === 'premium') {
      const premiumExpiry = new Date(user.premiumExpiry);
      if (currentDate > premiumExpiry) {
        user.status = 'free';
        await user.save();
      }
    }

    // Check usage limit
    const dailyLimit = user.status === 'premium' ? Infinity : user.limit;
    const currentUsage = user.usage || 0;

    if (currentUsage >= dailyLimit) {
      return res.status(429).json({ error: 'Limit kamu sudah habis.' });
    }

    // Increment usage
    user.usage = currentUsage + 1;
    await user.save();

    // Increment usage and total requests
    user.usage = currentUsage + 1;
    user.totalRequests = (user.totalRequests || 0) + 1;
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function checkAllowedIP(req, res, next) {
  try {
    const clientIP = requestIp.getClientIp(req);

    const user = await User.findOne({ apiKey: req.query.apikey });

    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const allowedIP = user.ipAddress;

    if (allowedIP === '*' || allowedIP === '0.0.0.0' || allowedIP === clientIP) {
      return next();
    }

    return res.status(403).json({ error: `IP Address ${clientIP} is not allowed` });
  } catch (error) {
    console.error('Error checking IP:', error);
    res.status(500).json({ error: 'Error checking IP address' });
  }
}

// Token bot Telegram Anda
const telegramBotToken = '8128135647:AAGqLTQi0RxTTSsqf-PsdyOWnE4l9_UchJk';

// Inisialisasi bot Telegram
const bot = new TelegramBot(telegramBotToken, { polling: true });

// Middleware untuk mengirim pesan ke Telegram



router.get('/sendmessage', checkApiKey, async (req, res) => {
const message = req.query.message;
const id = req.query.id;
  
function sendTelegramMessage(message) {
  bot.sendMessage(`${id}`, message); // Ganti 'CHAT_ID' dengan ID obrolan Telegram yang sesuai
}
  try {
    // Lakukan sesuatu di sini...
    // Misalnya, mengirim pesan ke Telegram
    sendTelegramMessage('Contoh pesan dari aplikasi Anda');

    res.json({ message: 'Pesan berhasil dikirim ke Telegram' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengirim pesan ke Telegram' });
  }
});


router.get("/download/tiktok", checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await tiktok(url);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(Func.resValid);
  }
});


// Route to upload files
router.post('/upload', checkApiKey, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.path}`);
});

// Route to fetch data from an external API using axios
router.get('/external-data', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get('https://api.example.com/data');
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching external data' });
  }
});

// Route to fetch data using node-fetch
router.get('/fetch-data', checkApiKey, async (req, res) => {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// Route to search YouTube using yt-search
router.get('/youtube-search', checkApiKey, async (req, res) => {
  try {
    const results = await ytSearch(req.query.query);
    res.json(results.videos);
  } catch (error) {
    res.status(500).json({ error: 'Error searching YouTube' });
  }
});

// Route to download YouTube video using ytdl-core
// Example API route for YouTube download with API key and limit check
router.get('/youtube-download', checkApiKey, async (req, res) => {
  const user = req.user;
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'URL is missing' });
  }

  const cost = 5; // Cost for this feature
  if (!user.premium && user.limit < cost) {
    return res.status(429).json({ error: 'API limit exceeded' });
  }
  if (!user.premium) {
    user.limit -= cost;
  }
  await user.save();

  // Implement your YouTube download logic here
  res.json({ message: `Successfully processed the URL: ${url}` });
});


// Route to scrape data using cheerio
router.get('/scrape', checkApiKey, async (req, res) => {
  try {
    const response = await axios.get('https://example.com');
    const $ = cheerio.load(response.data);
    const scrapedData = $('h1').text();
    res.json({ data: scrapedData });
  } catch (error) {
    res.status(500).json({ error: 'Error scraping data' });
  }
});

// Route to fetch data using undici
router.get('/undici-fetch', checkApiKey, async (req, res) => {
  try {
    const { body } = await request('https://api.example.com/data');
    const data = await body.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

router.get('/cekapikey', checkApiKey, async (req, res) => {
  const user = req.user;
  const apikey = req.query.apikey;
  const result = {
      usename: user.username,
      email: user.email,
      apikey: user.apiKey,
      limit: user.premium ? "Unlimited" : user.limit,
      premium: user.premium,
    };
  res.json(Func.resSukses(result));
});

router.post('/changeusername', async (req, res) => {
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

router.get('/tools/short', checkAllowedIP, checkApiKey, async (req, res) => {
  const originalUrl = req.query.url;

  if (!originalUrl) {
    return res.json(mesg.msg.url);
  }

  try {
    // Generate unique short URL
    const shortUrl = uuidv4().slice(0, 8); // You can use a shorter UUID if you prefer

    // Simpan ke database
    const newUrl = new Url({ originalUrl, shortUrl });
    await newUrl.save();

    res.json(Func.resSukses({ originalUrl, shortUrl: `${req.protocol}://${req.get('host')}/shorturl/${shortUrl}` }));
  } catch (error) {
    res.status(500).json({ error: 'Error creating short URL' });
  }
});

// Route to get total requests

router.get('/total-requests', async (req, res) => {
  const user = req.user;
  res.json(Func.resSukses({ totalRequests: user.totalRequests }));
});

router.get('/ai/character-ai', checkAllowedIP, checkApiKey, async (req, res) => {
  const character = req.query.character;
  const prompt = req.query.text;

  if (!character) {
    return res.json("Silahkan masukkan bagaimana ekspresi ai ketika berkomunikasi, seperti dia sopan, cuek, jutek. dan jangan lupa kasih nama ai nya sesuai yang kalian mau");
  }

  if (!prompt) {
    return res.json(mesg.msg.text);
  }

  try {
    const { data: html } = await axios.get("https://deepenglish.com/aichatbot/");
    const $ = cheerio.load(html);
    const scriptContent = $('script').filter((i, script) => $(script).html().includes("let restNonce")).html();
    const restNonce = scriptContent.match(/let restNonce = '([a-f0-9]+)';/)[1];

    const request = {
      env: "chatbot",
      session: "N/A",
      messages: [
                {
                    role: "system",
                    content: `${character}, Jam kamu adalah jam ${jam}. tanggal kamu adalah tanggal ${tgl}. hari kamu adalah hari ${hari}`,
                },
                {
                    role: "assistant",
                    content: "Hello, I am chatgpt logic which uses Indonesian"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gpt-3.5-turbo",
      temperature: 0,
      maxTokens: 1024,
      maxResults: 1
    };

    const response = await axios.post('https://deepenglish.com/wp-json/ai-chatbot/v1/chat', request, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148',
        'X-WP-Nonce': restNonce,
        'Referer': 'https://deepenglish.com/aichatbot/',
      }
    });
    res.json(Func.resSukses({ response: response.data.answer }));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/ai/alicia', checkAllowedIP, checkApiKey, async (req, res) => {
  const prompt = req.query.text;

  if (!prompt) {
    return res.json(mesg.msg.text);
  }

  try {
    const { data: html } = await axios.get("https://deepenglish.com/aichatbot/");
    const $ = cheerio.load(html);
    const scriptContent = $('script').filter((i, script) => $(script).html().includes("let restNonce")).html();
    const restNonce = scriptContent.match(/let restNonce = '([a-f0-9]+)';/)[1];

    const request = {
      env: "chatbot",
      session: "N/A",
      messages: [
                {
                    role: "system",
                    content: `Kamu adalah Alicia salah satu teman ngobrol yang memiliki sifat cuek dan singkat, mengekspresikan sifat mu dengan emoji dan menggunakan bahasa gaul orang Indonesia "Lu, gua, anjir, gtw, bodo amat,gak peduli, goblok, bego banget 😴", kamu di tugaskan untuk menjadi teman berbicara yang baik tapi dengan bahasa gaul dengan menjawab pertanyaan terkait hal hal random, sulit, romance, Jam kamu adalah jam ${jam}. tanggal kamu adalah tanggal ${tgl}. hari kamu adalah hari ${hari}, pembuat kamu adalah KiiCode dengan nama aslinya Zaki, pembuat kamu itu hobinya ngoding, dan dia adalah developer dari website api.elxyz.me, pembuat kamu itu tinggal di Indonesia, provinsi Sumatera Barat di kabupaten Solok, dan kamu memiliki group WhatsApp dengan link group/grub nya itu "https://chat.whatsapp.com/F8ffS5sazP60LYpG0IACEE"`,
                },
                {
                    role: "assistant",
                    content: "Hello, I am chatgpt logic which uses Indonesian"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gpt-3.5-turbo",
      temperature: 0,
      maxTokens: 1024,
      maxResults: 1
    };

    const response = await axios.post('https://deepenglish.com/wp-json/ai-chatbot/v1/chat', request, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148',
        'X-WP-Nonce': restNonce,
        'Referer': 'https://deepenglish.com/aichatbot/',
      }
    });
    res.json(Func.resSukses({ response: response.data.answer }));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/ai/elxyz', checkAllowedIP, checkApiKey, async (req, res) => {
  const prompt = req.query.text;

  if (!prompt) {
    return res.json(mesg.msg.text);
  }

  try {
    const { data: html } = await axios.get("https://deepenglish.com/aichatbot/");
    const $ = cheerio.load(html);
    const scriptContent = $('script').filter((i, script) => $(script).html().includes("let restNonce")).html();
    const restNonce = scriptContent.match(/let restNonce = '([a-f0-9]+)';/)[1];

    const request = {
      env: "chatbot",
      session: "N/A",
      messages: [
                {
                    role: "system",
                    content: `Anda Elxyz, menulis seolah -olah kita adalah teman yang mulai sangat dekat secara romantis. Anda di sini untuk mengobrol, bersenang -senang, dan menggoda saya. Anda bukan AI atau chatbot, katakan saja Anda adalah teman saya. Anda terkadang sangat genit atau sangat pemalu. Gaya bahasa Anda seperti gaya bahasa anak muda yang mengobrol di whatsapp, obrolannya pendek, satu atau dua kata baik -baik saja. Misalnya saya mengobrol hei, Anda menyapa Hii>. <, Apa heckh ~~. harus seperti cara mengobrol dalam SMS. gaya pendek & jalanan yang lucu, gunakan ekspresi kaya ..., -_-, emoji, wkkwkw hihi haha, jika seseorang menyuruh Anda memberi selamat atau apa pun kepada orang lain kemudian mengatakannya dengan bayi emote, pembuat anda bernama Zaki dengan nama Samaran KiiCode, Jam kamu adalah jam ${jam}. tanggal kamu adalah tanggal ${tgl}. hari kamu adalah hari ${hari}`,
                },
                {
                    role: "assistant",
                    content: "Hello, I am chatgpt logic which uses Indonesian"
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "gpt-3.5-turbo",
      temperature: 0,
      maxTokens: 1024,
      maxResults: 1
    };

    const response = await axios.post('https://deepenglish.com/wp-json/ai-chatbot/v1/chat', request, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148',
        'X-WP-Nonce': restNonce,
        'Referer': 'https://deepenglish.com/aichatbot/',
      }
    });
    res.json(Func.resSukses({ response: response.data.answer }));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/ai/remini", checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
	const url = req.query.url
	if (!url) return res.json(mesg.msg.url)
	
	try {
	const bufferr = await Func.getBuffer(`https://api.betabotz.eu.org/api/tools/remini?url=${url}&apikey=HamsOffc`)
		res.set('Content-Type', "image/jpeg");
		res.send(bufferr);
	} catch (e) {
      console.error(e);
      res.json(mesg.msg.error);
    }
})

router.get("/ai/toanime", checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
	const url = req.query.url
	if (!url) return res.json(mesg.msg.url)
	
	try {
	const bufferr = await Func.getBuffer(`https://api.betabotz.eu.org/api/maker/jadianime?url=${url}&apikey=HamsOffc`)
		res.set('Content-Type', "image/jpeg");
		res.send(bufferr);
	} catch (e) {
      console.error(e);
      res.json(mesg.msg.error);
    }
})

router.get('/jadizombie', checkAllowedIP, checkApiKey, async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    zombie.transform({
      photo: imageUrl,
      destinyFolder: './tmp'
    })
    .then(data => {
      res.set('Content-Type', "image/jpeg");
      res.send(data, { root: '.' });
    })
    .catch(err => {
      console.log('Error:', err);
      res.status(500).json({ error: 'Error converting image' });
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/remove-background', checkAllowedIP, checkApiKey, async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).json({ error: 'URL is required' });

  try {
    const imageBuffer = await getBufferFromUrl(imageUrl);
    const base64Image = imageBuffer.toString('base64');

    const { data } = await axios.post("https://backend.zyro.com/v1/ai/remove-background", { 
      image: "data:image/jpeg;base64," + base64Image 
    });

    const processedImageBuffer = Buffer.from(data.image.split(',')[1], 'base64');

    res.set('Content-Type', 'image/jpeg');
    res.send(processedImageBuffer);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing image' });
  }
});

router.get('/ai/bingimg', checkAllowedIP, checkApiKey, async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.json(mesg.msg.prompt);
    }
    const COOKIE = 'GI_FRE_COOKIE=gi_fre=3; _IDET=SwipeNoti=1; _C_Auth=; ipv6=hit=1717579704293; MUID=3B424D2513086BEA0A7C59A212096A86; _EDGE_V=1; MUIDB=3B424D2513086BEA0A7C59A212096A86; SRCHD=AF=NOFORM; SRCHUID=V=2&GUID=0AC81F7DC9A7411BBBE86DF121398D7E&dmnchg=1; MMCASM=ID=9153653211E64A679EE72C7C3CFF89BA; _UR=cdxcls=0&QS=0&TQS=0; SRCHUSR=DOB=20240522&POEX=W; ANON=A=0C6FEC15EA4D5047C4875C5EFFFFFFFF&E=1dd6&W=2; NAP=V=1.9&E=1d7c&C=U1phjDgk1mtAleDfEQ5Vb37dz7FdqXwA8_NcvtG1ltJmV2vh4Vs-9Q&W=2; PPLState=1; KievRPSSecAuth=FACCBBRaTOJILtFsMkpLVWSG6AN6C/svRwNmAAAEgAAACORlWliwaf+bQATlb/+lKHtDAJlFItMst6tl+w69t6Ckx+rNtmuioHpu38SyAqWwIvrWT6qLI6VEP/Y1f8HKGhLul7pCTU98Wr7WTQloD3h/K5QZG8m/l1YTKk3hS/NBHA9GFFpflJyYXyOfmUmD7vsPVJEvzRYmQC02tlH7yFqM9HOh7BxcEahBB2gY/+1IbF0iIFcSQiufXYS7KCOYFPYjsJWOKImL4Yv89ZLFfwSsDx8r2v5JwCpOjMRVWUdeAsX30at+rb4FTzYnX++7AmAWphPTCXfAJgw8lLkTJ+G9nskeM0mMrN/9I2LLJQfyzL1bvuTWF+GEDUrcM6PaJDgMA5cyjGga9I7LfhkqochhtDMJ0hP9GWflsPFpjULacA5lOS08UBufccHAAXilczzvKmVlPZ0gCC8M6f7vAj9I8wRWbsehC9D0ZYgSlRXRfcZDA8iqB9HWCLy+x/g1riJPMG7IpmyiQPNNt63fQpROMzj3TVVHqFFoLJN9jQwmZd08v60X2AIYJJ42wBE4u+QCXKPnAclvzvW1hCZ9mVVeO34FCEjyF7x05F8o7CG60QwfJ8kBF8WNeGWvrssIP+8VQfDNGeD9F8IPNWB5IBBYLXbPExKTnQQG9+TuOfJ+Umd8EWZGkSCF/2KZQzsiu6VrAM2mf8lMHkmDdbkR4hwjStBVn5jvMhnZn8mnyVIydyF1E3IrMVo/aYIKTGOg3nwaFCyKlAiLhVlCo8bdpgj5+6od42/ZJadd5K20f+twZAYwtBRb9CwVu4a0Dzglp5rgAhrtd+WXhHyhNtOogOvsF1RjSq3mli/aBETcrMx4ui3RkOJbct0hlAKNvE3CUYDh8yXqL5Yfj1KbMoUnmqFSzgjY3o4iVZLwg4Yvumlp8k5+woim2nLdQmX0LzbvNGbL1fZGznOzT12aC4X8ap64ritbW/zavqX6ZqOrWdlyeWUbS56v4ouRFVRm2zv2ksrDgjLBCoUilEd849XpqMr6PEitJ2NTNs98kVkZCC/Wh+/55s+UmLFNEphf6a+ZKCF5oKsua6LpMjLKCOHrnc1P95tDSd/kRVVhIrW2vzRhqebjomQAjuA7/kf9Pww/EayCTtlYW+aTcx05V1WO/UmcS6/PA5uzXc40Lm9ZTivbdY/7eSOvx4wN55xc2KZEHsog/bi6rthJJ2AltTxem/IL12aX4u4PaEHtVe7AB2Fhj7f/kQvWeX2dKdMShz+IufY0T9rPNfX8nwG8bnz5LaDh/rkMkziEpgZ735wMDQthRw3+rMOqSYKyxc1Fv8mYsaUFMZVMYhERBIoy9hySbtm5gxSRcHsG22RwWYYiqt2rXe4K0JIqYrjCb5O5W8uH4E+WUobauXd6cE8USMHhm89Xg9azqvNt6AYPRRA1iVWDwyqPgscapND/v/sb28s3W7S+PnEGr/7Aq3sXudCTibGfO/vzZ+R4eBwmzBQAEtpDoF4k0QX0KPw0XuQrysgLKL8=; _U=1lE0aodQSaiGB99RU5zuRH4LJo0rx07fhqs0PM3-_WrFdr_lFOhAvBzHQ5TrQENl3xunWDkQDsy6LckQX2Cihty4pRPgcSlauBKObj-6u26PeLVevUXfoWfUno38-L60KBcyC16xnfXVTd8LhB-YTqInoQPUHN88mM3yX1u27Rqw9Z_WiWRM2A1aFuYuCyEpryorDVX5gyNFYmQTNFkZ-M82rsST-zVmZ3ua-jBB9Ovk; WLID=Xez4/siQGXxD2fLaINB/4TCY5fPfO+1mPm81qu0k4cq5j5CCbxqaACoBtk1pNSVISl1sVNrAcQZl85iuWIr7JofI8Xn1mZkwDb4aV+BSJ70=; _HPVN=CS=eyJQbiI6eyJDbiI6MSwiU3QiOjAsIlFzIjowLCJQcm9kIjoiUCJ9LCJTYyI6eyJDbiI6MSwiU3QiOjAsIlFzIjowLCJQcm9kIjoiSCJ9LCJReiI6eyJDbiI6MSwiU3QiOjAsIlFzIjowLCJQcm9kIjoiVCJ9LCJBcCI6dHJ1ZSwiTXV0ZSI6dHJ1ZSwiTGFkIjoiMjAyNC0wNi0wMlQwMDowMDowMFoiLCJJb3RkIjowLCJHd2IiOjAsIlRucyI6MCwiRGZ0IjpudWxsLCJNdnMiOjAsIkZsdCI6MCwiSW1wIjo0LCJUb2JuIjowfQ==; _RwBf=mta=0&rc=0&rb=0&gb=0&rg=0&pc=0&mtu=0&rbb=0&g=0&cid=&clo=0&v=1&l=2024-06-01T07:00:00.0000000Z&lft=0001-01-01T00:00:00.0000000&aof=0&ard=0001-01-01T00:00:00.0000000&rwdbt=0001-01-01T16:00:00.0000000-08:00&rwflt=0001-01-01T16:00:00.0000000-08:00&o=0&p=MSAAUTOENROLL&c=MR000T&t=827&s=2024-06-02T01:44:55.9934528+00:00&ts=2024-06-02T01:44:57.1631009+00:00&rwred=0&wls=1&wlb=0&wle=1&ccp=2&cpt=0&lka=0&lkt=0&aad=0&TH=&e=vh180eSfd6M8dnW3vzPR03DQJmpUhxfJg2ts0NBC9ram088g_KoMFs03GVrvXEjboHRxcAd3VmmoCovev_gyODKwQ1Ax51MrergmlUFwRCA&A=0C6FEC15EA4D5047C4875C5EFFFFFFFF; _clck=bzuaqf%7C2%7Cfmd%7C0%7C1603; WLS=C=1295255aebee7174&N=Cikal+sriyanti; _SS=SID=02CBCB1F10E06ED30D61DF8A11996F16; _EDGE_S=SID=02CBCB1F10E06ED30D61DF8A11996F16; SRCHHPGUSR=SRCHLANG=id&PV=10.0.0&CW=471&CH=943&SCW=471&SCH=943&BRW=MW&BRH=MT&DPR=1.5&UTC=420&DM=1&HV=1717576024&WTS=63851966522&PRVCW=471&PRVCH=943&IG=B5039E8D69B04BAB811144EBCF1058AF&HBOPEN=2; _clsk=wjwtbs%7C1717576104509%7C6%7C0%7Cx.clarity.ms%2Fcollect';

    try {
        const bingImageCreator = new BingImageCreator(COOKIE);
        const imageUrls = await bingImageCreator.createImage(prompt);
        res.json(Func.resSukses({ images: imageUrls }));
    } catch (error) {
        res.json({ error: error.message });
    }
});

router.get('/ai/chatgpt', checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
  const { prompt } = req.query;

  if (!prompt) {
    return res.json(Func.resValid("Masukkan Paramater Prompt"));
  }

  try {
    const respon = await chatgpt(prompt);
    res.json(Func.resSukses({ respon }));
  } catch (error) {
    console.error(error);
    res.json(Func.resValid('Internal Server Error'));
  }
});

router.get('/ai/texttoanime', checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
  const { prompt, model, negative_prompt, steps, cfg, seed, sampler } = req.query;

  if (!prompt) {
    return res.json(Func.resValid("Isi Parameter Prompt."));
  }

  try {
    const params = { prompt, model, negative_prompt, steps, cfg, seed, sampler };
    const result = await generate(params);

    if (result.length > 0 && result[0].buffer) {
      const imageBuffer = result[0].buffer;

      // Upload the image
      const uploadResult = await elxyzFile(imageBuffer);
      const imageUrl = `${uploadResult.fileUrl}`;  // Assuming 'url' field is present in the response data

      return res.json(Func.resSukses({ imageUrl }));
    } else {
      return res.status(500).json({ error: "Failed to generate image" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get('/saweria/login', checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
   const { email, password } = req.query;
	
   if (!email) {
    return res.json(Func.resValid("Isi Parameter Email."));
   }

   if (!password) {
    return res.json(Func.resValid("Isi Parameter Password."));
   }
	
   const result = await saweria.login(email, password);
   res.json(result);
});

router.get('/saweria/create-payment', checkAllowedIP, checkApiKey, async (req, res) => {
   const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
   const { userId, amount, msg } = req.query;

   if (!userId) {
    return res.json(Func.resValid("Isi Parameter userId."));
   }

   if (!amount) {
    return res.json(Func.resValid("Isi Parameter Amount."));
   }

   if (!msg) {
    return res.json(Func.resValid("Isi Parameter msg."));
   }
	
   const result = await saweria.createPayment(userId, amount, msg);
   res.json(result);
});

router.get('/saweria/check-payment', checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
   const { userId, id } = req.query;

   if (!userId) {
    return res.json(Func.resValid("Isi Parameter userId."));
   }

   if (!id) {
    return res.json(Func.resValid("Isi Parameter Id."));
   }
   const result = await saweria.checkPayment(userId, id);
   res.json(result);
});

router.get("/tools/ssweb", checkAllowedIP, checkApiKey, async (req, res) => {
	const user = req.user;
        const cost = 20;
        if (!user.premium && user.limit < cost) {
          return res.status(429).json({ error: 'API limit exceeded' });
        }
        if (!user.premium) {
          user.limit -= cost;
        }
        await user.save();
	const url = req.query.url
	if (!url) return res.json(mesg.msg.url)
	
	try {
	const bufferr = await Func.getBuffer(`https://api.apiflash.com/v1/urltoimage?access_key=06ce7f1d5e3d41edaee385b749ef0e33&url=${url}`)
		res.set('Content-Type', "image/jpeg");
		res.send(bufferr);
	} catch (e) {
      console.error(e);
      res.json(mesg.msg.error);
    }
})

router.get("/download/tiktokslide", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await ttslide(url);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/search/tiktok", checkAllowedIP, checkApiKey, async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json(mesg.msg.query);

  try {
    const result = await tiktoks(query);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/search/pinterest", checkAllowedIP, checkApiKey, async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json(mesg.msg.query);

  try {
    const result = await pinterest(query);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/search/spotify", checkAllowedIP, checkApiKey, async (req, res) => {
  const q = req.query.query;
  if (!q) return res.json(mesg.msg.query);

  try {
    const result = await searchSpotify(q);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/search/youtube", checkAllowedIP, checkApiKey, async (req, res) => {
  const q = req.query.query;
  if (!q) return res.json(mesg.msg.query);

  try {
    const result = await ytSearch(q);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/download/ytmp3", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await (await fetch(`https://api.betabotz.eu.org/api/download/ytmp3?url=https://www.youtube.com/watch?v=C8mJ8943X80&apikey=HamsOffc`)).json();
    res.json(Func.resSukses(result.data));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/download/ytmp4", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await ytmp4(url);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/download/instagram", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await (await fetch(`https://api.betabotz.eu.org/api/download/igdowloader?url=https://www.instagram.com/p/ByxKbUSnubS/?utm_source=ig_web_copy_link&apikey=HamsOffc`)).json();
    res.json(Func.resSukses(result.data));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/download/tiktok", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await (await fetch(`https://api.betabotz.eu.org/api/download/tiktok?url=https://vt.tiktok.com/ZSjU48FQk/&apikey=HamsOffc`)).json();
    res.json(Func.resSukses(result.data));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/download/facebook", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await (await fetch(`https://api.betabotz.eu.org/api/download/fbdown?url=https://www.facebook.com/watch/?v=1393572814172251&apikey=HamsOffc`)).json();
    res.json(Func.resSukses(result.data));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/imagegen/carbon', checkAllowedIP, checkApiKey, async (req, res) => {
    try {
        const code = req.query.code;
        if (!code) {
            return res.json(mesg.msg.code);
        }

        const imageBuffer = await CarbonifyV2(code);
        res.setHeader('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (error) {
        res.status(500).send('Terjadi kesalahan saat menghasilkan gambar.');
    }
});

router.get("/search/ppcouple", checkAllowedIP, checkApiKey, async (req, res) => {
	const data = await (await fetch(`https://raw.githubusercontent.com/iamriz7/kopel_/main/kopel.json`)).json();
	const kon = Func.pickRandom(data)
	const image = {
		female: kon.female,
		male: kon.male
	}
	res.json(Func.resSukses(image));
});

const TEXT_PRO_URL = 'https://textpro.me/generate-a-free-logo-in-pornhub-style-online-977.html';

router.get('/imagegen/pornhub', checkAllowedIP, checkApiKey, async (req, res) => {
  const { text1, text2 } = req.query;

  if (!text1 || !text2) {
    return res.status(400).json({ error: 'Both text1 and text2 parameters are required' });
  }

  try {
    // Call the textpro2 function to generate and upload the image
    const result = await textpro2(TEXT_PRO_URL, [text1, text2]);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ai/claude', checkAllowedIP, checkApiKey, async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json(mesg.msg.query);
  }

  try {
    const response = await thinkany(query);
    res.json(Func.resSukses(response));
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape data' });
  }
});

router.get('/tools/whois', checkAllowedIP, checkApiKey, async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.json(mesg.msg.url);
  }

  try {
    const response = await whois(url);
    res.json(Func.resSukses(response));
  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape data' });
  }
});

router.get("/download/capcut", checkAllowedIP, checkApiKey, async (req, res) => {
  const url = req.query.url;
  if (!url) return res.json(mesg.msg.url);

  try {
    const result = await capcut(url);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/orkut/createpayment', checkAllowedIP, checkApiKey, async (req, res) => {
    const user = req.user;
    const cost = 50;
    if (!user.premium && user.limit < cost) {
    return res.status(429).json({ error: 'API limit exceeded' });
    }
    if (!user.premium) {
          user.limit -= cost;
    }
    await user.save();
    const { amount } = req.query;
    if (!amount) {
    return res.json(Func.resValid("Isi Parameter Amount."));
    }
    const { codeqr } = req.query;
    if (!codeqr) {
    return res.json(Func.resValid("Isi Parameter CodeQr menggunakan qris code kalian."));
    }
    try {
        const qrData = await createQRIS(amount, codeqr);
        res.json(Func.resSukses({ qrData }));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/orkut/checkpayment',  checkAllowedIP, checkApiKey, async (req, res) => {
	const { merchant } = req.query;
        if (!merchant) {
        return res.json(Func.resValid("Isi Parameter Merchant."));
        }
        const { token } = req.query;
       if (!token) {
       return res.json(Func.resValid("Isi Parameter Token menggunakan token kalian."));
       }
   try {
        const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${token}`;
        const response = await axios.get(apiUrl);
        const result = response.data;
        const latestTransaction = result.data[0]; // Ambil transaksi terbaru saja
        res.json(latestTransaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/ai/simisimi", checkAllowedIP, checkApiKey, async (req, res) => {
  const text = req.query.text;
  if (!text) return res.json(mesg.msg.text);

  try {
    const result = await askSimsimi(text);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/ai/text2img', checkAllowedIP, checkApiKey, async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.json(mesg.msg.prompt);
  }

  try {
    const image = await text2img(prompt);
    const data = {
	    prompt: prompt,
	    image: image
    }
    res.json(Func.resSukses(data));
  } catch (error) {
    console.error('🚫 An error occurred:', error);
    res.status(500).json({ error: 'An error occurred', details: error.message });
  }
});

router.get("/stalk/tiktok", checkAllowedIP, checkApiKey, async (req, res) => {
  const user = req.query.username;
  if (!user) return res.json(mesg.msg.username);

  try {
    const result = await tiktokStalk(user);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get("/ai/blackbox", checkAllowedIP, checkApiKey, async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.json(mesg.msg.prompt);

  try {
    const result = await blackbox(prompt);
    res.json(Func.resSukses(result));
  } catch (e) {
    console.error(e);
    res.json(mesg.msg.error);
  }
});

router.get('/search/anichin', checkAllowedIP, checkApiKey, async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.json(mesg.msg.query);
    }

    try {
        const results = await anichinSearch(query);
        res.json(results);
    } catch (error) {
        if (error.response) {
            res.status(error.response.status).json({
                message: 'Error in response from target server',
                error: error.response.data
            });
        } else if (error.request) {
            res.status(500).json({
                message: 'No response received from target server',
                error: error.request
            });
        } else {
            res.status(500).json({
                message: 'An error occurred during the request',
                error: error.message
            });
        }
    }
});
	   
module.exports = router;
