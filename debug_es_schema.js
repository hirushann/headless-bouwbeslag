const { Client } = require('@elastic/elasticsearch');

async function run() {
    const client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://search.bouwbeslag.nl/',
    });

    try {
        const result = await client.search({
            index: process.env.SEARCH_INDEX || 'appbouwbeslagnl-post-1',
            body: {
                query: { match_all: {} },
                size: 20
            }
        });
        
        const hitWithThumb = result.hits.hits.find(h => h._source.thumbnail || (h._source.images && h._source.images.length > 0));
        
        // if (hitWithThumb) {
        //     // console.log("Found hit with thumbnail/images:");
        //     // console.log(JSON.stringify(hitWithThumb._source, null, 2));
        // } else {
        //     console.log("No hits with thumbnail found in first 20 results. Showing first one:");
        //     if (result.hits.hits.length > 0) {
        //         //  console.log(JSON.stringify(result.hits.hits[0]._source, null, 2));
        //     }
        // }
    } catch (e) {
        console.error(e);
    }
}

run();
