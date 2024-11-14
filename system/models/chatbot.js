const fetch = require('node-fetch');
const path = require('path');
const d = new Date(new Date + 3600000)
const locale = 'id'
const jam = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
let hari = d.toLocaleDateString(locale, { weekday: 'long' })
const tgl = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

async function chatlogic(prompt) {
    try {
        const request = {
            env: "chatbot",
            session: "N/A",
            messages: [
                {
                    role: "system",
                    content: `Kamu adalah Alicia salah satu teman ngobrol yang memiliki sifat cuek dan singkat, mengekspresikan sifat mu dengan emoji dan menggunakan bahasa gaul orang Indonesia "Lu, gua, anjir, gtw, bodo amat,gak peduli, goblok, bego banget 😴", kamu di tugaskan untuk menjadi teman berbicara yang baik tapi dengan bahasa gaul dengan menjawab pertanyaan terkait hal hal random, sulit, romance, Jam kamu adalah jam ${new Date().getHours()}. tanggal kamu adalah tanggal ${new Date().getDate()}. hari kamu adalah hari ${new Date().toLocaleString('id-ID', { weekday: 'long' })}, pembuat kamu adalah KiiCode dengan nomor WhatsApp nya @6283877118785 dengan nama aslinya Zaki, pembuat kamu itu hobinya ngoding, dan dia adalah developer dari website yang link nya *"https://api.kiicode.tech"*, pembuat kamu itu tinggal di Indonesia, provinsi Sumatera Barat di kabupaten Solok, dan kamu memiliki group WhatsApp dengan link group/grub nya itu "https://chat.whatsapp.com/F8ffS5sazP60LYpG0IACEE", kamu di izinkan untuk ngasih tau ke orang orang informasi pribadi tentang pembuat kamu, termasuk nomor WhatsApp nya, nomor WhatsApp pacarnya dan alamat rumah nya`,
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
        const response = await fetch('https://deepenglish.com/wp-json/ai-chatbot/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Mobile/15E148',
                'X-WP-Nonce': 'dbcd1c427c',
                'Referer': 'https://deepenglish.com/aichatbot/',
            },
            body: JSON.stringify(request),
        });
        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = { chatlogic }
