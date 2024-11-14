const ytdl = require('ytdl-core');
const axios = require('axios');

async function ytmp4(url) {
    try {
        if (!ytdl.validateURL(url)) {
            throw new Error('URL YouTube tidak valid.');
        }

        const info = await ytdl.getInfo(url);
        const audioFormats = info.formats.filter(format => format.mimeType && format.mimeType.includes('audio'));
        
        if (audioFormats.length === 0) {
            throw new Error('Tidak ada format audio yang ditemukan.');
        }

        const audioFormat = audioFormats[0];

        const result = {
            title: info.videoDetails.title,
            description: info.videoDetails.description,
            video: info.formats[0].url,
            audio: audioFormat.url
        };

        return result;
    } catch (err) {
        console.error(err.message);
        throw err;
    }
}

async function capcut(url) {
  const requestData = {
    url: url
  };

  try {
    let { data: responseData } = await axios.post('https://api.teknogram.id/v1/capcut', requestData, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    const modifiedUrl = responseData.url.replace("open.", "");

    return {
      title: responseData.title,
      size: responseData.size,
      url: modifiedUrl
    };
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}

module.exports = { ytmp4, capcut };
