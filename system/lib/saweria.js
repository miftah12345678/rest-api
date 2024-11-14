const axios = require("axios");
const cheerio = require('cheerio');
const qrcode = require("qrcode");
const moment = require("moment-timezone");
const fs = require('fs');
const FormData = require('form-data');

const elxyzFile = async (Path) => 
  new Promise(async (resolve, reject) => {
    if (!fs.existsSync(Path)) return reject(new Error("File not Found"));
    
    try {
      const form = new FormData();
      form.append("file", fs.createReadStream(Path));

      const response = await axios.post('https://cdn.elxyz.me/', form, {
        headers: form.getHeaders(),
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            console.log(`🚀 Panggunan Lajeng: ${(progressEvent.loaded * 100) / progressEvent.total}%`);
          }
        }
      });

      console.log('🎉 Berkas Tundun kasil:', response.data);
      resolve(response.data); // Menggunakan resolve untuk mengembalikan data dari Promise
    } catch (error) {
      console.error('🚫 Tundun Gagal:', error);
      reject(error); // Menggunakan reject untuk mengembalikan error dari Promise
    }
  });

class Saweria {
   constructor() {
      this.user_id = null;
      this.token = null;
      this.user_email = null;
      this.baseUrl = 'https://saweria.co';
      this.apiUrl = 'https://backend.saweria.co';
      this.bPending = '/donations/balance-imv';
      this.bAvailable = '/donations/available-balance';
   }

   login = async (email, password) => {
      try {
         const response = await axios.post(`${this.apiUrl}/auth/login`, {
            email,
            password
         }, {
            headers: {
               "Accept": "*/*",
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
               "Origin": this.baseUrl,
               "Referer": `${this.baseUrl}/`,
               "Referrer-Policy": "strict-origin-when-cross-origin"
            }
         });

         const json = response.data;
         console.log("Login Response:", json);

         if (!json.data || !json.data.id) {
            return {
               creator: "HamsOffc.",
               status: false,
               msg: 'Gagal login'
            };
         }

         this.user_id = json.data.id;
         this.token = response.headers['authorization'];
         this.user_email = json.data.email;

         // Mengambil informasi pengguna
         const userInfo = json.data;

         // Mengambil saldo

         return {
            creator: "Hams Offc - Ibham Wiradinata",
            status: true,
            data: {
               user_id: this.user_id,
               token: this.token,
               username: userInfo.username,
               email: userInfo.email,
               profile_url: `${this.baseUrl}/${userInfo.username}`,
               profile_picture: userInfo.profile_picture
            }
         };
      } catch (e) {
         console.log(e.response ? e.response.data : e.message);
         return {
            creator: "HamsOffc.",
            status: false,
            msg: e.response ? e.response.data.message : e.message
         };
      }
   }

   createPayment = async (userId, amount, msg = 'Order') => {
      try {
         if (!userId) {
            return {
               creator: "Hams Offc - Ibham Wiradinata",
               status: false,
               msg: 'USER ID NOT FOUND'
            };
         }

         const response = await axios.post(this.apiUrl + '/donations/' + userId, {
            agree: true,
            amount: Number(amount),
            customer_info: {
               first_name: 'Payment Gateway',
               email: this.user_email,
               phone: '',
            },
            message: msg,
            notUnderAge: true,
            payment_type: 'qris',
            vote: ''
         }, {
            headers: {
               "Accept": "*/*",
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
               "Origin": this.baseUrl,
               "Referer": `${this.baseUrl}/`,
               "Referrer-Policy": "strict-origin-when-cross-origin"
            }
         });

         const json = response.data;
         if (!json || !json.data || !json.data.id) {
            return {
               creator: "Hams Offc - Ibham Wiradinata",
               status: false,
               msg: 'ERROR!'
            };
         }

         // Generate QR code
         const qrFilePath = `./qr-${json.data.id}.png`;
         await qrcode.toFile(qrFilePath, json.data.qr_string, {
            scale: 8
         });

         // Upload the QR code image
         const uploadResponse = await elxyzFile(qrFilePath);

         // Clean up the QR code image file
         fs.unlinkSync(qrFilePath);

         return {
            creator: "HamsOffc.",
            status: true,
            data: {
               ...json.data,
               expired_at: moment(json.data.created_at).add(10, 'minutes').format('DD/MM/YYYY HH:mm:ss'),
               receipt: this.baseUrl + '/qris/' + json.data.id,
               url: this.baseUrl + '/qris/' + json.data.id,
               qr_image: uploadResponse.fileUrl // Update to use the uploaded image URL
            }
         };
      } catch (e) {
         console.log(e.response ? e.response.data : e.message);
         return {
            creator: "Hams Offc - Ibham Wiradinata.",
            status: false,
            msg: e.response ? e.response.data.message : e.message
         };
      }
   }

   checkPayment = async (userId, id) => {
      try {
         if (!userId) {
            return {
               creator: "Hams Offc - Ibham Wiradinata.",
               status: false,
               msg: 'USER ID NOT FOUND'
            };
         }
         const response = await axios.get(this.baseUrl + '/receipt/' + id, {
            headers: {
               "Accept": "*/*",
               "User-Agent": "Mozilla/5.0 (Linux; Android 6.0.1; SM-J500G) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36",
               "Origin": this.baseUrl,
               "Referer": this.baseUrl + '/receipt/' + id,
               "Referrer-Policy": "strict-origin-when-cross-origin"
            }
         });

         const html = response.data;
         const $ = cheerio.load(html);
         const msg = $('h2[class="chakra-heading css-14dtuui"]').text();
         if (!msg) {
            return {
               creator: "Hams Offc - Ibham Wiradinata.",
               status: false,
               msg: 'TRANSAKSI TIDAK TERDAFTAR ATAU BELUM TERSELESAIKAN*\n\n*catatan: tolong cek status transaksi kamu dengan mengetik check sekali lagi jika yakin telah menyelesaikan transaksi pembayaran'
            };
         }
         const status = msg.toLowerCase() === 'berhasil';
         return {
            creator: "HamsOffc.",
            status,
            msg: msg.toUpperCase()
         };
      } catch (e) {
         console.log(e.response ? e.response.data : e.message);
         return {
            creator: "Hams Offc - Ibham Wiradinata.",
            status: false,
            msg: e.response ? e.response.data.message : e.message
         };
      }
   }
}

module.exports = { Saweria };
