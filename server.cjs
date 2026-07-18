const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log('CLIENT_LOG:', body);
    res.end('ok');
  });
}).listen(8080);
