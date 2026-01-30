
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200', // adjust if needed
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  }
});

async function run() {
  try {
    const result = await client.search({
      index: process.env.ELASTICSEARCH_INDEX || 'products', // guess index or use env
      body: {
        size: 1,
        query: { match_all: {} }
      }
    });
    // console.log(JSON.stringify(result.hits.hits[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}

// Check for env vars, if not present we might fail, but usually they are in .env.lcoal
// Since I can't load .env easily with node directly without dotenv, I'll rely on the app running it or just try to run it with run_command and hope for the best or inspect .env
// console.log("Starting...");
// run(); 
