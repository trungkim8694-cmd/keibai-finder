const http = require('http');
const path = require('path');

process.env.NODE_PATH = 'C:\\kigyou-list\\frontend\\node_modules;G:\\My Drive\\LapTrinh\\keibaiKoubai\\web\\node_modules';
process.env.PORT = '3000';

const next = require('C:/kigyou-list/frontend/node_modules/next');

const dev = true;
const hostname = 'localhost';
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
  dir: path.resolve(__dirname, '../web'),
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Request error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, () => {
    console.log('====================================================');
    console.log(`> KEIBAI FINDER SERVER READY ON http://${hostname}:${port}`);
    console.log(`> HOME DATA HUB: http://${hostname}:${port}`);
    console.log(`> MAP INTERACTIVE: http://${hostname}:${port}/map`);
    console.log(`> AUCTION RESULTS: http://${hostname}:${port}/auction-results`);
    console.log('====================================================');
  });
}).catch((err) => {
  console.error('Fatal Next app error:', err);
});
