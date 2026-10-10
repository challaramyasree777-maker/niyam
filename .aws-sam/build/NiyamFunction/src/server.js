const http = require('http');
const { handle } = require('./handler');

http.createServer((req, res) => {
  let data = '';
  req.on('data', c => { data += c; if (data.length > 100000) req.destroy(); });
  req.on('end', async () => {
    const out = await handle(req.method, req.url.split('?')[0], data);
    res.writeHead(out.status, { 'Content-Type': out.type });
    res.end(out.body);
  });
}).listen(3000, () => console.log('Niyam running at http://localhost:3000'));