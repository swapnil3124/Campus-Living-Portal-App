const http = require('http');
const data = JSON.stringify({ staffId: "wrdshwe1051", password: "Shwe@WRD1051" });

const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/staff-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, res => {
    let str = '';
    res.on('data', chunk => str += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, str));
});

req.on('error', console.error);
req.write(data);
req.end();
