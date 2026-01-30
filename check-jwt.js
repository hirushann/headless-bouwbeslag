const https = require('https');

https.get('https://app.bouwbeslag.nl/wp-json', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.namespaces && json.namespaces.includes('jwt-auth/v1')) {
        // console.log('jwt-auth/v1 is PRESENT');
      } else {
        // console.log('jwt-auth/v1 is MISSING');
        // console.log('Available namespaces:', json.namespaces);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching WP JSON:', err.message);
});
