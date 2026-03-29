const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Check if SSL certificates exist
let useHttps = false;
let httpsOptions = {};

try {
  if (fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem')) {
    httpsOptions = {
      key: fs.readFileSync('./localhost+2-key.pem'),
      cert: fs.readFileSync('./localhost+2.pem'),
    };
    useHttps = true;
    console.log('SSL certificates found. Starting HTTPS server...');
  } else {
    console.log('SSL certificates not found. Starting HTTP server...');
    console.log('To enable HTTPS, generate certificates with mkcert:');
    console.log('  1. Install mkcert: choco install mkcert');
    console.log('  2. Run: mkcert -install');
    console.log('  3. Run: mkcert localhost 127.0.0.1 ::1');
  }
} catch (err) {
  console.log('SSL certificate check failed. Starting HTTP server...');
}

app.prepare().then(() => {
  const server = useHttps
    ? createHttpsServer(httpsOptions, async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error occurred handling', req.url, err);
          res.statusCode = 500;
          res.end('internal server error');
        }
      })
    : createHttpServer(async (req, res) => {
        try {
          const parsedUrl = parse(req.url, true);
          await handle(req, res, parsedUrl);
        } catch (err) {
          console.error('Error occurred handling', req.url, err);
          res.statusCode = 500;
          res.end('internal server error');
        }
      });

  server.listen(port, (err) => {
    if (err) throw err;
    const protocol = useHttps ? 'https' : 'http';
    console.log(`> Ready on ${protocol}://${hostname}:${port}`);
  });
});
