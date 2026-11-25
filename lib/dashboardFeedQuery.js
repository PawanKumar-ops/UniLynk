export const DASHBOARD_FEED_STALE_TIME = 60 * 1000;
export const DASHBOARD_POSTS_GC_TIME = 30 * 60 * 1000;
export const DASHBOARD_FEED_PAGE_SIZE = 15;

export const dashboardFeedQueryKey = (audience) => [
  "dashboard",
  "posts",
  "feed",
  audience,
];

export async function fetchDashboardFeedPage({ audience, cursor, signal }) {
  const params = new URLSearchParams({
    audience,
    limit: String(DASHBOARD_FEED_PAGE_SIZE),
  });
  if (cursor) params.set("cursor", cursor);

  const response = await fetch(`/api/posts?${params.toString()}`, { signal });
  const body = await response.text();
  let data = {};
  try {
    data = body.trim() ? JSON.parse(body) : {};
  } catch {
    data = { error: `Posts request failed with status ${response.status}` };
  }
  if (!response.ok) throw new Error(data?.error || "Failed to fetch posts");

  return {
    posts: Array.isArray(data.posts) ? data.posts : [],
    nextCursor: data.nextCursor || null,
    hasMore: Boolean(data.hasMore),
  };
}

export function prefetchDashboardFeed(queryClient) {
  return queryClient.prefetchInfiniteQuery({
    queryKey: dashboardFeedQueryKey("for-you"),
    queryFn: ({ pageParam = null, signal }) =>
      fetchDashboardFeedPage({ audience: "for-you", cursor: pageParam, signal }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor || undefined : undefined,
    staleTime: DASHBOARD_FEED_STALE_TIME,
    gcTime: DASHBOARD_POSTS_GC_TIME,
  });
}
