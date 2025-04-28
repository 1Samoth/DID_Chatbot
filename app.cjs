const express = require('express');
const http = require('http');
const path = require('path');

const port = 3000;

const app = express();
app.use('/', express.static(path.join(__dirname, 'src')));
const server = http.createServer(app);

server.listen(port, () => console.log(`Server started on port localhost:${port}`));
