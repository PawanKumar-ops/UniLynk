import { connectDB } from "./mongodb.js";
import Post from "../models/post.js";

const CONFIG = {
  newestWeight: 0.70,
  trendingWeight: 0.20,
  randomWeight: 0.10,
  trendingCutoffDays: 30,
  safetyMargin: 30,
  archiveStartMs: 365 * 24 * 60 * 60 * 1000,
};

const METADATA_PROJECTION = {
  _id: 1,
  authorEmail: 1,
  authorName: 1,
  clubId: 1,
  postAs: 1,
  createdAt: 1,
  trendingScore: 1,
  likeCount: 1,
  commentCount: 1,
  bookmarkCount: 1,
  poll: 1,
};

const blendPattern = [
  "newest",
  "trending",
  "newest",
  "newest",
  "random",
  "newest",
  "newest",
  "trending",
  "newest",
  "newest",
];

function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const encodeCursorDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
};

const normalizeSourceCursor = (cursor) => {
  if (!cursor || typeof cursor !== "object") return null;
  const id = typeof cursor.id === "string" ? cursor.id : null;
  const createdAt = encodeCursorDate(cursor.createdAt);
  const score = Number(cursor.score);

  if (!id) return null;

  return {
    id,
    createdAt,
    score: Number.isFinite(score) ? score : null,
  };
};

const buildSourceCursor = (postOrCursor) => {
  if (!postOrCursor) return null;
  if (postOrCursor._id) {
    return {
      id: postOrCursor._id.toString(),
      createdAt: encodeCursorDate(postOrCursor.createdAt),
      score: Number(postOrCursor.trendingScore || 0),
    };
  }
  return normalizeSourceCursor(postOrCursor);
};

export const encodeFeedCursor = ({
  snapshotTimestamp,
  randomSeed,
  newestCursor = null,
  trendingCursor = null,
  randomCursor = null,
}) => Buffer.from(
  JSON.stringify({
    t: snapshotTimestamp,
    s: randomSeed,
    n: newestCursor,
    tr: trendingCursor,
    r: randomCursor,
  })
).toString("base64url");

export const decodeFeedCursor = (cursorStr) => {
  if (typeof cursorStr !== "string" || !cursorStr.trim()) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursorStr, "base64url").toString("utf8"));
    if (typeof parsed?.t !== "number" || typeof parsed?.s !== "number") return null;

    return {
      t: parsed.t,
      s: parsed.s,
      newestCursor: normalizeSourceCursor(parsed.n ?? parsed.newestCursor),
      trendingCursor: normalizeSourceCursor(parsed.tr ?? parsed.trendingCursor),
      randomCursor: normalizeSourceCursor(parsed.r ?? parsed.randomCursor),
    };
  } catch {
    return null;
  }
};

export const calculateTrendingScore = (post, nowMs = Date.now()) => {
  const likes = Number(post?.likeCount || 0);
  const comments = Number(post?.commentCount ?? (Array.isArray(post?.comments) ? post.comments.length : 0));
  const pollVotes = Number(post?.poll?.totalVotes || 0);
  const bookmarks = Number(post?.bookmarkCount || 0);
  const createdAtMs = post?.createdAt instanceof Date
    ? post.createdAt.getTime()
    : new Date(post?.createdAt || nowMs).getTime();
  const ageHours = Math.max(0, (nowMs - createdAtMs) / 3600000);

  return (likes * 10 + comments * 15 + pollVotes * 5 + bookmarks * 12 + 1) / Math.pow(ageHours + 2, 1.5);
};

export async function updatePostTrendingScore(postId) {
  try {
    await connectDB();
    const post = await Post.findById(postId, {
      createdAt: 1,
      likeCount: 1,
      commentCount: 1,
      bookmarkCount: 1,
      poll: 1,
    }).lean();
    if (!post) return;

    await Post.updateOne(
      { _id: postId },
      { $set: { trendingScore: calculateTrendingScore(post) } }
    );
  } catch (error) {
    console.error(`Failed to update trending score for post ${postId}:`, error);
  }
}

const applyDateCursor = (field, cursor) => {
  if (!cursor?.createdAt || !cursor?.id) return {};
  const cursorDate = new Date(cursor.createdAt);
  return {
    $or: [
      { [field]: { $lt: cursorDate } },
      { [field]: cursorDate, _id: { $lt: cursor.id } },
    ],
  };
};

const applyTrendingCursor = (cursor) => {
  if (cursor?.score === null || !cursor?.id) return {};
  return {
    $or: [
      { trendingScore: { $lt: cursor.score } },
      { trendingScore: cursor.score, _id: { $lt: cursor.id } },
    ],
  };
};

const combineQuery = (...parts) => {
  const query = {};
  const and = [];

  for (const part of parts) {
    if (!part || Object.keys(part).length === 0) continue;
    if (part.$or) {
      and.push(part);
    } else {
      Object.assign(query, part);
    }
  }

  if (and.length) query.$and = [...(query.$and || []), ...and];
  return query;
};

const getPostKey = (post) => {
  if (post.postAs === "club" && post.clubId) return `club_${post.clubId}`;
  return `user_${post.authorEmail || post.authorName || post._id.toString()}`;
};

const pickFromPool = ({ pool, pointer, seenIds, mergedFeed, checkConsecutive = true }) => {
  let nextPointer = pointer;

  while (nextPointer < pool.length) {
    const post = pool[nextPointer];
    const idStr = post._id.toString();

    if (seenIds.has(idStr)) {
      nextPointer += 1;
      continue;
    }

    if (checkConsecutive && mergedFeed.length >= 2) {
      const key = getPostKey(post);
      const prev1 = getPostKey(mergedFeed[mergedFeed.length - 1].post);
      const prev2 = getPostKey(mergedFeed[mergedFeed.length - 2].post);
      if (key === prev1 && key === prev2) {
        nextPointer += 1;
        continue;
      }
    }

    return { post, nextPointer };
  }

  return null;
};

export async function getHybridFeedPosts(baseQuery, limit, cursor) {
  await connectDB();

  const snapshotTimestamp = cursor?.t ?? Date.now();
  const randomSeed = cursor?.s ?? Math.random();
  const snapshotDate = new Date(snapshotTimestamp);
  const poolLimit = Math.max(limit + CONFIG.safetyMargin, limit + 1);

  const newestPoolLimit = Math.ceil(poolLimit * CONFIG.newestWeight) + limit;
  const trendingPoolLimit = Math.ceil(poolLimit * CONFIG.trendingWeight) + limit;
  const randomPoolLimit = Math.ceil(poolLimit * CONFIG.randomWeight) + limit;

  const newestPoolPromise = Post.find(
    combineQuery(
      baseQuery,
      { createdAt: { $lte: snapshotDate } },
      applyDateCursor("createdAt", cursor?.newestCursor)
    ),
    METADATA_PROJECTION
  )
    .sort({ createdAt: -1, _id: -1 })
    .limit(newestPoolLimit)
    .lean();

  const trendingCutoff = new Date(snapshotTimestamp - CONFIG.trendingCutoffDays * 24 * 60 * 60 * 1000);
  const trendingPoolPromise = Post.find(
    combineQuery(
      baseQuery,
      { createdAt: { $gte: trendingCutoff, $lte: snapshotDate } },
      applyTrendingCursor(cursor?.trendingCursor)
    ),
    METADATA_PROJECTION
  )
    .sort({ trendingScore: -1, _id: -1 })
    .limit(trendingPoolLimit)
    .lean();

  const intSeed = Math.floor(randomSeed * 4294967296);
  const rand = mulberry32(intSeed);
  const archiveStart = new Date(snapshotTimestamp - CONFIG.archiveStartMs);
  const rangeWidth = trendingCutoff.getTime() - archiveStart.getTime();
  const randomStart = cursor?.randomCursor?.createdAt
    ? new Date(cursor.randomCursor.createdAt)
    : new Date(archiveStart.getTime() + (rangeWidth > 0 ? rand() * rangeWidth : 0));

  const randomPoolPromise = Post.find(
    combineQuery(
      baseQuery,
      {
        createdAt: { $lt: randomStart },
        $or: [
          { likeCount: { $gt: 0 } },
          { commentCount: { $gt: 0 } },
          { bookmarkCount: { $gt: 0 } },
          { "poll.totalVotes": { $gt: 0 } },
        ],
      },
      applyDateCursor("createdAt", cursor?.randomCursor)
    ),
    METADATA_PROJECTION
  )
    .sort({ createdAt: -1, _id: -1 })
    .limit(randomPoolLimit)
    .lean();

  const [newestPool, trendingPoolRaw, randomPoolRaw] = await Promise.all([
    newestPoolPromise,
    trendingPoolPromise,
    randomPoolPromise,
  ]);

  const trendingPool = trendingPoolRaw;

  const randomPool = [...randomPoolRaw];
  for (let i = randomPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [randomPool[i], randomPool[j]] = [randomPool[j], randomPool[i]];
  }

  const seenIds = new Set();
  const mergedFeed = [];
  const pools = { newest: newestPool, trending: trendingPool, random: randomPool };
  const pointers = { newest: 0, trending: 0, random: 0 };
  const consumed = { newest: null, trending: null, random: null };

  const selectFromSource = (source, checkConsecutive) => {
    const selected = pickFromPool({
      pool: pools[source],
      pointer: pointers[source],
      seenIds,
      mergedFeed,
      checkConsecutive,
    });

    if (!selected) return null;

    pointers[source] = selected.nextPointer + 1;
    consumed[source] = selected.post;
    return { source, post: selected.post };
  };

  for (let k = 0; k < limit; k += 1) {
    const targetSource = blendPattern[k % blendPattern.length];
    let selected = selectFromSource(targetSource, true);

    for (const source of ["newest", "trending", "random"]) {
      if (selected) break;
      selected = selectFromSource(source, true);
    }

    if (!selected) selected = selectFromSource(targetSource, false);

    for (const source of ["newest", "trending", "random"]) {
      if (selected) break;
      selected = selectFromSource(source, false);
    }

    if (!selected) break;

    seenIds.add(selected.post._id.toString());
    mergedFeed.push(selected);
  }

  const targetIds = mergedFeed.map(({ post }) => post._id);
  const fullPosts = targetIds.length ? await Post.find({ _id: { $in: targetIds } }).lean() : [];
  const fullPostsMap = new Map(fullPosts.map((post) => [post._id.toString(), post]));
  const orderedPosts = targetIds.map((id) => fullPostsMap.get(id.toString())).filter(Boolean);
  const hasMore = orderedPosts.length === limit && Object.keys(pools).some((source) => pointers[source] < pools[source].length);

  const nextCursor = hasMore
    ? encodeFeedCursor({
        snapshotTimestamp,
        randomSeed,
        newestCursor: buildSourceCursor(consumed.newest ?? cursor?.newestCursor),
        trendingCursor: buildSourceCursor(consumed.trending ?? cursor?.trendingCursor),
        randomCursor: buildSourceCursor(consumed.random ?? cursor?.randomCursor),
      })
    : null;

  return { posts: orderedPosts, nextCursor, hasMore };
}
