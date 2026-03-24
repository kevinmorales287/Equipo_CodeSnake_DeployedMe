const http = require('http');

console.log('Testing /api/conceptos...');
http.get('http://localhost:3000/api/conceptos?q=diabetes', (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`BODY: ${data.substring(0, 100)}...`));
}).on('error', (err) => console.error(`ERROR: ${err.message}`));
