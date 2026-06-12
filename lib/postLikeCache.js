const memoryCache = global.__postLikeCache || new Map();
global.__postLikeCache = memoryCache;

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const hasRedis = Boolean(redisUrl && redisToken);

const redisCommand = async (command, ...args) => {
  if (!hasRedis) return null;

  const res = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([command, ...args]),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Redis command failed: ${command}`);
  }

  const payload = await res.json();
  return payload?.result ?? null;
};

const keyForPost = (postId) => `post:likes:${postId}`;

export const getLikeCount = async (postId, fallbackCount = 0) => {
  const key = keyForPost(postId);

  if (hasRedis) {
    const redisValue = await redisCommand("GET", key);
    if (redisValue !== null && redisValue !== undefined) {
      return Number(redisValue);
    }
  }

  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  memoryCache.set(key, fallbackCount);

  if (hasRedis) {
    await redisCommand("SET", key, String(fallbackCount));
  }

  return fallbackCount;
};

export const getLikeCounts = async (posts = []) => {
  const fallbackById = new Map(
    posts.map((post) => [post._id?.toString?.() ?? String(post._id || post.postId || ""), Number(post.likeCount || 0)])
  );
  const countsById = new Map();

  const postIds = [...fallbackById.keys()].filter(Boolean);
  if (!postIds.length) return countsById;

  if (hasRedis) {
    await Promise.all(postIds.map(async (postId) => {
      const key = keyForPost(postId);
      const redisValue = await redisCommand("GET", key);
      if (redisValue !== null && redisValue !== undefined) {
        countsById.set(postId, Number(redisValue));
      }
    }));
  }

  for (const postId of postIds) {
    if (countsById.has(postId)) continue;

    const key = keyForPost(postId);
    if (memoryCache.has(key)) {
      countsById.set(postId, memoryCache.get(key));
      continue;
    }

    const fallbackCount = fallbackById.get(postId) || 0;
    memoryCache.set(key, fallbackCount);
    countsById.set(postId, fallbackCount);

    if (hasRedis) {
      await redisCommand("SET", key, String(fallbackCount));
    }
  }

  return countsById;
};

export const adjustLikeCount = async (postId, delta, fallbackCount = 0) => {
  const key = keyForPost(postId);

  if (hasRedis) {
    const command = delta > 0 ? "INCRBY" : "DECRBY";
    const updated = await redisCommand(command, key, String(Math.abs(delta)));
    return Math.max(0, Number(updated));
  }

  const current = memoryCache.has(key) ? memoryCache.get(key) : fallbackCount;
  const next = Math.max(0, current + delta);
  memoryCache.set(key, next);
  return next;
};
