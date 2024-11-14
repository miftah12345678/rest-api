const axios = require('axios');
const cheerio = require('cheerio');

async function anichinSearch(query) {
    try {
        const url = `https://anichin.site/?s=${query}`;
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        const results = [];

        const elements = $('.listupd .bs').toArray();
        const fetchEpisodeInfoPromises = elements.map(async (element) => {
            const title = $(element).find('.tt h2').text().trim();
            const link = $(element).find('.bsx > a').attr('href');
            const image = $(element).find('img').attr('data-lazy-src');
            const type = $(element).find('.typez').text().trim();
            const status = $(element).find('.bt .epx').text().trim();
            const subtitle = $(element).find('.bt .sb').text().trim();

            const episodeInfo = await getEpisodeInfo(link);

            return {
                title,
                link,
                image,
                type,
                status,
                subtitle,
                episodeCount: episodeInfo.episodeCount,
                episodes: episodeInfo.episodes
            };
        });

        const fetchedResults = await Promise.all(fetchEpisodeInfoPromises);
        results.push(...fetchedResults);

        return results;

    } catch (error) {
        console.error('Error:', error);
        throw new Error('Scraping failed');
    }
}

async function getEpisodeInfo(link) {
    try {
        const response = await axios.get(link);
        const html = response.data;
        const $ = cheerio.load(html);

        const episodes = [];
        const episodeCount = $('.eplister ul li').length;

        const episodeElements = $('.eplister ul li').toArray();
        const fetchVideoUrlPromises = episodeElements.map(async (element) => {
            const episodeNumber = $(element).find('.epl-num').text().trim();
            const episodeTitle = $(element).find('.epl-title').text().trim();
            const episodeSubtitle = $(element).find('.epl-sub .status').text().trim();
            const episodeDate = $(element).find('.epl-date').text().trim();
            const episodeLink = $(element).find('a').attr('href');

            const videoUrl = await getVideoUrl(episodeLink);

            return {
                number: episodeNumber,
                title: episodeTitle,
                subtitle: episodeSubtitle,
                date: episodeDate,
                url: episodeLink,
                videoUrl: videoUrl
            };
        });

        const fetchedEpisodes = await Promise.all(fetchVideoUrlPromises);
        episodes.push(...fetchedEpisodes);

        return { episodeCount, episodes };

    } catch (error) {
        console.error('Error fetching episode info:', error);
        return { episodeCount: 0, episodes: [] };
    }
}

async function getVideoUrl(episodeLink) {
    try {
        const response = await axios.get(episodeLink);
        const html = response.data;
        const $ = cheerio.load(html);

        const videoUrl = $('.video-content .player-embed iframe').attr('data-lazy-src') || 
                         $('.video-content .player-embed iframe').attr('src');

        return videoUrl;

    } catch (error) {
        console.error('Error fetching video URL:', error);
        return null;
    }
}

module.exports = { anichinSearch, getEpisodeInfo, getVideoUrl };
