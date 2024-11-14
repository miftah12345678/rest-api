const fetch = require('node-fetch');
const axios = require('axios');
const {
  v4: uuidv4
} = require("uuid")

async function chatgpt(prompt) {
    try {
        const BASE_URL = 'https://www.seaart.ai/api/v1/chat-completion/completion';
        const tokenizer = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTcyMjQwNTUyNCwiaWF0IjoxNzE3MjIxNTI0LCJqdGkiOiI0MDc1OTQzNzU1NTcyMjI0NSIsInBheWxvYWQiOnsiaWQiOiJjZjJkMTE4OGFlZjc5Y2MxY2E3MDQxZmY3NzhhNTYyYiIsImVtYWlsIjoia2hvaXJ1bG11c3RvZmE3NjdAZ21haWwuY29tIiwiY3JlYXRlX2F0IjoxNjg4NjIzODI3NTg3LCJ0b2tlbl9zdGF0dXMiOjAsInN0YXR1cyI6MX19.OyAQ8TaRHq0dhoSwV5Vcva_4Jh0Qj3_c1b6uyaY1RBsOuzHHQaWMUFw-O3ReNRjY6_hb0xoCW1uUnGqQJzKP6ipTmTG6MaaWUm8tfAoNGAwOkx3wKIm4gcyk3LotiB1QQBJTmA6BU3Dn7NdUxwoY7Fp7RCauU9P4iaocYIFas8aGFaxxKH61hUlkdB984VuiZWSE5VHcBH1ZeYJP8guYN-CrnesP7NoKwuC8RUtWME-gpjFO4LlU-iuwgSflWDmr2jIKVt0WNgkM7Wc9yKcZCRyKlA2RE-6ZWTAkzyVDx4srDFGh4ANafUhvtYEpa6a3J0IRH_SsFK0Zm7JiXjiJ5w';
        const request = {
            model_name: "gpt-3.5-turbo",
            messages: [
                {
                    content: prompt,
                    role: "user"
                }
            ]
        };
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148',
                'token': `${tokenizer}`,
                'Accept-Language': 'en',
            },
            body: JSON.stringify(request),
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return data;
        } else {
            const text = await response.text();
            return text;
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

const api = axios.create({
  baseURL: 'https://thinkany.ai/api',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://thinkany.ai/'
  }
});

/**
  * Scraper By QanyPaw
  * Forbidden to sell and delete my wm, respect the creator
*/

async function thinkany(content) {
  try {
    const newConversationData = { content, locale: "en", mode: "search", model: "claude-3-haiku", source: "all" };
    const { data } = await api.post('/new-conversation', newConversationData);

    const chatData = {
      role: "user",
      content: data.data.content,
      conv_uuid: data.data.uuid,
      mode: data.data.mode,
      is_new: true,
      model: data.data.llm_model
    };

    const chatResponse = await api.post('/chat', chatData);
    return chatResponse.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
                                         }

async function askSimsimi(text) {
  const url = 'https://simsimi.vn/web/simtalk';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36',
    Referer: 'https://simsimi.vn/'
  };

  try {
    const response = await axios.post(url, `text=${encodeURIComponent(text)}&lc=id`, { headers });
    return response.data.success;
  } catch (error) {
    console.error('Error asking SimSimi:', error);
    throw error;
  }
}

async function blackbox(prompt) {
  try {
    const response = await axios.post('https://www.blackbox.ai/api/chat', {
      messages: [{
        id: uuidv4(),
        content: prompt,
        role: 'user'
      }],
      id: uuidv4(),
      previewToken: null,
      userId: '47b37fe9-1ac9-4097-a719-2cc1a0729b10',
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      isChromeExt: false,
      githubToken: null,
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: null
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    })
    let result = response.data
    result = result.replace(/\$@v=v1\.10-rv2\$@\$/g, '')
    .replace(/Sources:.*/g, '')
    .replace(/$/g, '')
    const content = result.match(/content":"(.*?)"/)
    return content
  } catch (error) {
    console.error(error)
    throw error
  }
}

module.exports = { chatgpt, thinkany, askSimsimi, blackbox };
