"use server";

import client from "@/lib/elasticsearch";

export interface SearchResult {
  ID: number;
  post_title: string;
  post_name: string;
}

export async function searchProducts(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  try {
    const result = await client.search({
      index: process.env.ELASTICSEARCH_INDEX as string,
      query: {
        bool: {
          must: [
            { match: { post_type: "product" } },
            {
              multi_match: {
                query: query,
                fields: ["post_title", "post_content", "meta", "meta._sku.value"],
              },
            },
          ],
        },
      },
      size: 5,
      _source: ["post_title", "post_name", "ID"],
    });

    const hits = result.hits.hits.map((hit: any) => hit._source as SearchResult);
    return hits;
  } catch (error) {
    console.error("Elasticsearch server action error:", error);
    return [];
  }
}
