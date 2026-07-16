export function buildMeilisearchPagination(limit: number, offset: number) {
  const safeLimit = Math.max(1, Math.floor(limit));

  return {
    hitsPerPage: safeLimit,
    page: Math.floor(Math.max(0, offset) / safeLimit) + 1,
  };
}

export function resolveMeilisearchTotal(data: Record<string, unknown>, hitCount: number): number {
  if (typeof data.totalHits === "number") {
    return data.totalHits;
  }

  if (typeof data.estimatedTotalHits === "number") {
    return data.estimatedTotalHits;
  }

  return hitCount;
}
