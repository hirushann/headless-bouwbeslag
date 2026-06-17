import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import elasticClient from "./src/lib/elasticsearch";
async function run() {
  const result = await elasticClient.search({
      index: process.env.ELASTICSEARCH_INDEX || "bouwbeslag_app_post_1",
      body: { query: { match: { post_title: "raamkruk" } }, _source: ["terms"] }
  });
  console.log(JSON.stringify(result.hits.hits[0]._source.terms.product_cat, null, 2));
}
run();
