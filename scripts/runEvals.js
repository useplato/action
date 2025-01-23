const https = require('https');

const BASE_URL = process.env.BASE_URL;

async function callEndpoint() {
  const options = {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.get(`${BASE_URL}/api/eval`, options, (res) => {
      let data = '';

      // Handle stream data
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Handle end of stream
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
          return;
        }

        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`API returned error: ${response.error}`));
            return;
          }
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Run the function
callEndpoint()
  .then(response => {
    console.log('Success:', response);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
