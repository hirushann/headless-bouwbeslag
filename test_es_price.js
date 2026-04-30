const api = require('./src/lib/elasticsearch.ts');
async function run() {
  require('dotenv').config({ path: '.env.local' });
  const client = api.default;
  
  const estQuery = {
      index: process.env.SEARCH_INDEX || process.env.ELASTICSEARCH_INDEX || "appbouwbeslagnl-post-1",
      body: {
          query: {
              bool: {
                  must: [{ match: { post_type: "product" } }],
              },
          },
          size: 1,
          _source: ["post_title", "meta"]
      },
  };

  const result = await client.search(estQuery);
  const source = result.hits.hits[0]._source;
  console.log("Meta fields related to price:", Object.keys(source.meta).filter(k => k.includes('price')));
  console.log("Price values:", source.meta._price, source.meta._regular_price, source.meta.crucial_data_b2b_and_b2c_sales_price_b2c);
}
run();
