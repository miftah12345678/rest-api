const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cookie = require('cookie');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

/**
 * Uploads the image to the specified uploader service
 * @param {String} imagePath - Path to the image file
 * @returns {String} - URL of the uploaded image
 */
async function elxyzFile(imagePath) {
  if (!fs.existsSync(imagePath)) throw new Error("File not found");

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(imagePath));

    console.log(`Uploading file from path: ${imagePath}`);

    const response = await axios.post('https://cdn.elxyz.me/', form, {
      headers: form.getHeaders(),
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          console.log(`🚀 Upload Progress: ${(progressEvent.loaded * 100) / progressEvent.total}%`);
        }
      }
    });

    console.log('🎉 File Upload Success:', response.data);
    return response.data.fileUrl;  // Return the URL of the uploaded image
  } catch (error) {
    console.error('🚫 Upload Failed:', error);
    throw error;
  }
}

/**
 * Post request to the TextPro API
 * @param {String} url - URL of the API
 * @param {Object} formdata - Form data to send
 * @param {String} cookies - Cookies to send
 * @returns {Object} - JSON response
 */
async function post(url, formdata = {}, cookies) {
  let encode = encodeURIComponent;
  let body = Object.keys(formdata)
    .map((key) => {
      let vals = formdata[key];
      let isArray = Array.isArray(vals);
      let keys = encode(key + (isArray ? "[]" : ""));
      if (!isArray) vals = [vals];
      let out = [];
      for (let valq of vals) out.push(keys + "=" + encode(valq));
      return out.join("&");
    })
    .join("&");
  return await fetch(`${url}?${body}`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Cookie: cookies,
    },
  }).then(res => res.json());
}

/**
 * TextPro Scraper
 * @function
 * @param {String} url - Your TextPro URL, example https://textpro.me/generate-a-free-logo-in-pornhub-style-online-977.html.
 * @param {String[]} texts - Array of texts (required). example ["text1", "text2"]
 * @returns {String} - URL of the uploaded image
 */
async function textpro2(url, texts) {
  if (!/^https:\/\/textpro\.me\/.+\.html$/.test(url))
    throw new Error("Invalid URL!!");

  // Generate the image with TextPro
  const geturl = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });
  const caritoken = await geturl.text();
  let hasilcookie = geturl.headers.get("set-cookie")
    .split(",")
    .map((v) => cookie.parse(v))
    .reduce((a, c) => ({ ...a, ...c }), {});
  hasilcookie = {
    __cfduid: hasilcookie.__cfduid,
    PHPSESSID: hasilcookie.PHPSESSID,
  };
  hasilcookie = Object.entries(hasilcookie)
    .map(([name, value]) => cookie.serialize(name, value))
    .join("; ");
  const $ = cheerio.load(caritoken);
  const token = $('input[name="token"]').attr("value");
  const form = new FormData();
  texts.forEach(text => form.append("text[]", text));
  form.append("submit", "Go");
  form.append("token", token);
  form.append("build_server", "https://textpro.me");
  form.append("build_server_id", 1);
  const geturl2 = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      Cookie: hasilcookie,
      ...form.getHeaders(),
    },
    body: form.getBuffer(),
  });
  const caritoken2 = await geturl2.text();
  const token2 = /<div.*?id="form_value".+>(.*?)<\/div>/.exec(caritoken2);
  if (!token2) throw new Error("Token Not Found!!");
  const prosesimage = await post(
    "https://textpro.me/effect/create-image",
    JSON.parse(token2[1]),
    hasilcookie
  );
  const hasil = await prosesimage;

  // Download the image
  const imageUrl = `https://textpro.me${hasil.fullsize_image}`;
  const imagePath = 'temp_image.jpg'; // Temporarily save the image locally
  const writer = fs.createWriteStream(imagePath);
  const response = await axios({
    url: imageUrl,
    method: 'GET',
    responseType: 'stream',
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Referer": url
    }
  });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', async () => {
      try {
        // Upload the image
        const uploadedImageUrl = await elxyzFile(imagePath);
        resolve(uploadedImageUrl);
      } catch (error) {
        reject(error);
      } finally {
        // Clean up: Delete the temporary image file
        fs.unlinkSync(imagePath);
      }
    });
    writer.on('error', reject);
  });
}

module.exports = {
  textpro2
};
