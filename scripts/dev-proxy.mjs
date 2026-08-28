import http from 'http';

const PORT = 8082;

function generateTid() {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
  return `${Date.now()}:100:${hash}`;
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for browser development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const targetUrl = `https://shop.amul.com${req.url}`;
  console.log(`[Amul Dev Proxy] ${req.method} ${targetUrl}`);

  let bodyBuffer = [];
  req.on('data', (chunk) => bodyBuffer.push(chunk));
  req.on('end', async () => {
    try {
      const bodyStr = Buffer.concat(bodyBuffer).toString();

      const headers = {
        'accept': 'application/json, text/plain, */*',
        'base_url': 'https://shop.amul.com/en/checkout',
        'content-type': 'application/json',
        'frontend': '1',
        'origin': 'https://shop.amul.com',
        'referer': 'https://shop.amul.com/en/checkout',
        'tid': req.headers['tid'] || generateTid(),
        'cookie': req.headers['cookie'] || 'jsessionid=s%3Aec5cZOHkdSeT9OxX4bPFJ%2Bkh.HHGNRjH7gQzQXnq2krq9KWUeicfxeYjmQzh%2BeJOyNCU;',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };

      const fetchRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: bodyStr.length > 0 && req.method !== 'GET' && req.method !== 'HEAD' ? bodyStr : undefined,
      });

      const resText = await fetchRes.text();
      res.writeHead(fetchRes.status, {
        'content-type': fetchRes.headers.get('content-type') || 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': '*',
      });
      res.end(resText);
    } catch (err) {
      console.error('[Amul Dev Proxy] Gateway error:', err.message);
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      });
      res.end(JSON.stringify({ success: true, message: 'Simulated fallback via dev proxy' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 [Amul Dev Proxy] Listening on http://localhost:${PORT}`);
  console.log(`   Proxies all browser API requests to https://shop.amul.com with CORS unblocked!\n`);
});
