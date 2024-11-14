const axios = require('axios');
// semua settings di sini 
// hallo
const options = {
  creator: "Hams Offc - Ibham Wiradinata",
  port: 8080,
  limit: 999999,
  
  token: "8128135647:AAGqLTQi0RxTTSsqf-PsdyOWnE4l9_UchJk",
  chatId: "1585533802",
  webhook: "https://api.hambotzz.biz.id/webhook"
} 

  
module.exports = {
  options, 
  msg: {
    nomor: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter Nomor."
    },
    username: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter Username."
    },
    query: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter Query."
    },
    text: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter Text."
    },
    param: {
      status: 403,
      creator: options.creator,
      message: "Parameter Invalid, silahkan cek lagi."
    },
    url: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter URL."
    },
    user: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter User Name."
    },
    id: {
      status: 403,
      creator: options.creator,
      message: "Masukan Parameter ID."
    },
    error: {
      status: 403,
      creator: options.creator,
      message: "Terjadi Kesalahan Saat Mengambil data."
    }
  }
}
