// Placeholder for backend server
const http = require('http');

const hostname = '127.0.0.1';
const port = 3001; // Different port from frontend

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Backend server is running\\n');
});

server.listen(port, hostname, () => {
  console.log(`Backend server running at http://${hostname}:${port}/`);
});
