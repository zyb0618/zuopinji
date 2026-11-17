// 零依赖静态开发服务器：npm run dev -- --port 7100 --host 127.0.0.1
const http = require('http');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function argVal(names, fallback) {
    for (let i = 0; i < args.length; i++) {
        for (const n of names) {
            if (args[i] === n && args[i + 1]) return args[i + 1];
            if (args[i].startsWith(n + '=')) return args[i].split('=')[1];
        }
    }
    return fallback;
}

const port = parseInt(argVal(['--port', '-p'], process.env.PORT || '7100'), 10);
const host = argVal(['--host', '-H'], process.env.HOST || '0.0.0.0');
const root = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
};

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.normalize(path.join(root, urlPath));
    if (!filePath.startsWith(root)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('404 Not Found');
        }
        res.writeHead(200, {
            'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
        });
        res.end(data);
    });
}).listen(port, host, () => {
    console.log(`Portfolio dev server running at http://localhost:${port}/`);
});
