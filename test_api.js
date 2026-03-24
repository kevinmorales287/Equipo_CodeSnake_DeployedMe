const fetch = require('node-fetch'); // Not installed, use http instead
const http = require('http');

http.get('http://localhost:3000/api/conceptos?q=diabetes', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
