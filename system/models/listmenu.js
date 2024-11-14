// system/models/listmenu.js
const listMenu = [
  { id: 1, 
   name: "TikTok", 
   parameters: "url, apiKey", 
   method: "GET", 
   status: "ONLINE", 
   tryUrl: `/download/tiktok?apikey=&url=` },
  { id: 2, 
   name: "TikTok Slide", 
   parameters: "url, apiKey", 
   method: "GET", 
   status: "ONLINE", 
   tryUrl: `/download/tiktokslide?apikey=&url=` },
  { id: 3, 
   name: "YouTube Downloader", 
   parameters: "url, apiKey", 
   method: "GET", 
   status: "ONLINE", 
   tryUrl: `/download/youtube?apikey=&url=` },
  { id: 4, 
   name: "Instagram Downloader", 
   parameters: "url, apiKey", 
   method: "GET", 
   status: "ONLINE", 
   tryUrl: `/download/instagram?apikey=&url=` },
  { id: 5, 
   name: "CapCut Downloader", 
   parameters: "url, apiKey", 
   method: "GET", 
   status: "ONLINE", 
   tryUrl: `/download/capcut?apikey=&url=` },
  // Tambahkan item menu lainnya di sini
];

module.exports = listMenu;