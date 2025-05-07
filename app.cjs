const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const path = require('path');

const port = 3000;

const app = express();

app.get('/fetch-title', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('Missing "url" query parameter');
    }

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        let title = $('title').text() || $('meta[property="og:title"]').attr('content') || 'Title not found';
        title = title.split('-')[0].trim();
        res.json({ title });
    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Failed to fetch URL');
    }
});

app.use('/', express.static(path.join(__dirname, 'src')));
const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
