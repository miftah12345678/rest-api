const fetch = require('node-fetch');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const downloadImage = async (url, filepath) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    let error = null;
    writer.on('error', (err) => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) {
        resolve(filepath);
      }
    });
  });
};

const elxyzFile = async (Path) => {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(Path)) return reject(new Error('File not Found'));

    try {
      const form = new FormData();
      form.append('file', fs.createReadStream(Path));

      console.log(`Uploading file from path: ${Path}`);

      const response = await axios.post('https://cdn.elxyz.me/', form, {
        headers: form.getHeaders(),
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            console.log(`🚀 Upload Progress: ${(progressEvent.loaded * 100) / progressEvent.total}%`);
          }
        },
      });

      console.log('🎉 File Upload Success:', response.data);
      resolve(response.data);
    } catch (error) {
      console.error('🚫 Upload Failed:', error);
      reject(error);
    }
  });
};

const text2img = async (prompt) => {
  try {
    const url = await fetch(`https://tti.photoleapapp.com/api/v1/generate?prompt=${encodeURIComponent(prompt)}`);
    const data = await url.json();

    if (!data.result_url) {
      throw new Error('Failed to generate image');
    }

    const imageUrl = data.result_url;
    const filepath = path.join(__dirname, 'downloaded_image.jpg');

    // Download the image
    await downloadImage(imageUrl, filepath);

    // Upload the image to elxyz
    const uploadData = await elxyzFile(filepath);

    // Return the URL of the uploaded file
    return { url: uploadData.fileUrl };
  } catch (err) {
    return { message: String(err) };
  }
};

module.exports = { text2img };
