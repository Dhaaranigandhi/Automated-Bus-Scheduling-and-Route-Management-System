const http = require('http');

const data = JSON.stringify({
  licenseNumber: 'DL-2026-0001',
  licenseExpiry: '2035-12-31',
  medicalStatus: 'FIT',
  availabilityStatus: 'AVAILABLE',
  performanceScore: 4.8
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/drivers/4',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
