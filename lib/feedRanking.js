import { connectDB } from "./mongodb.js";
import Post from "../models/post.js";
import User from "../models/user.js";

const CONFIG = {
  newestWeight: 0.70,
  trendingWeight: 0.20,
  randomWeight: 0.10,
  trendingCutoffDays: 30,
  consecutiveLimit: 2,
  safetyMargin: 30, // extra posts fetched to prevent running out during blending
  archiveStartMs: 365 * 24 * 60 * 60 * 1000, // 1 year ago fallback
  decayIntervalMs: 5 * 60 * 1000, // 5 minutes background throttle
};

// Seeded Mulberry32 random generator
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const encodeFeedCursor = (snapshotTimestamp, seed, offset) => {
  return Buffer.from(
    JSON.stringify({
      t: snapshotTimestamp,
      s: seed,
      o: offset
    })
  ).toString("base64url");
};

export const decodeFeedCursor = (cursorStr) => {
  if (typeof cursorStr !== "string" || !cursorStr.trim()) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursorStr, "base64url").toString("utf8"));
    if (typeof parsed?.t !== "number" || typeof parsed?.s !== "number" || typeof parsed?.o !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export async function updatePostTrendingScore(postId) {
  try {
    await connectDB();
    const post = await Post.findById(postId);
    if (!post) return;

    const likes = post.likeCount || 0;
    const comments = Array.isArray(post.comments) ? post.comments.length : 0;
    const pollVotes = post.poll?.totalVotes || 0;
    const bookmarks = await User.countDocuments({ savedPosts: postId });

    const ageHours = Math.max(0, (Date.now() - post.createdAt.getTime()) / 3600000);
    const trendingScore = (likes * 10 + comments * 15 + pollVotes * 5 + bookmarks * 12 + 1) / Math.pow(ageHours + 2, 1.5);

    await Post.updateOne({ _id: postId }, { $set: { trendingScore } });
  } catch (error) {
    console.error(`Failed to update trending score for post ${postId}:`, error);
  }
}

let lastDecayRun = 0;

export async function runBackgroundDecay() {
  const now = Date.now();
  if (now - lastDecayRun < CONFIG.decayIntervalMs) return;
  lastDecayRun = now;

  // Run asynchronously in the background so it doesn't block the request
  (async () => {
    try {
      await connectDB();
      const cutoff = new Date(Date.now() - CONFIG.trendingCutoffDays * 24 * 60 * 60 * 1000);
      
      const posts = await Post.find(
        { createdAt: { $gte: cutoff } },
        { _id: 1, createdAt: 1, likeCount: 1, comments: 1, poll: 1 }
      ).lean();

      if (posts.length === 0) return;

      const bookmarkCounts = await User.aggregate([
        { $match: { savedPosts: { $exists: true, $not: { $size: 0 } } } },
        { $unwind: "$savedPosts" },
        { $group: { _id: "$savedPosts", count: { $sum: 1 } } }
      ]);
      const bookmarkMap = new Map(bookmarkCounts.map(b => [b._id.toString(), b.count]));

      const bulkOps = posts.map(post => {
        const likes = post.likeCount || 0;
        const comments = Array.isArray(post.comments) ? post.comments.length : 0;
        const pollVotes = post.poll?.totalVotes || 0;
        const bookmarks = bookmarkMap.get(post._id.toString()) || 0;
        const ageHours = Math.max(0, (now - post.createdAt.getTime()) / 3600000);
        const trendingScore = (likes * 10 + comments * 15 + pollVotes * 5 + bookmarks * 12 + 1) / Math.pow(ageHours + 2, 1.5);

        return {
          updateOne: {
            filter: { _id: post._id },
            update: { $set: { trendingScore } }
          }
        };
      });

      if (bulkOps.length > 0) {
        await Post.bulkWrite(bulkOps, { ordered: false });
      }
    } catch (err) {
      console.error("Background decay update error:", err);
    }
  })();
}

export async function getHybridFeedPosts(baseQuery, limit, cursor) {
  await connectDB();

  // Trigger the background decay check
  void runBackgroundDecay();

  const snapshotTimestamp = cursor?.t ?? Date.now();
  const seed = cursor?.s ?? Math.random();
  const offset = cursor?.o ?? 0;

  // Total items we need to construct in memory for this request
  const totalNeeded = offset + limit + CONFIG.safetyMargin;

  // Calculate adaptive pool sizes
  const newestPoolLimit = Math.ceil(totalNeeded * CONFIG.newestWeight) + 10;
  const trendingPoolLimit = Math.ceil(totalNeeded * CONFIG.trendingWeight) + 5;
  const randomPoolLimit = Math.ceil(totalNeeded * CONFIG.randomWeight) + 5;

  // 1. Fetch newest pool metadata
  const newestPoolPromise = Post.find(
    {
      ...baseQuery,
      createdAt: { $lte: new Date(snapshotTimestamp) }
    },
    { _id: 1, authorEmail: 1, clubId: 1, postAs: 1 }
  )
    .sort({ createdAt: -1, _id: -1 })
    .limit(newestPoolLimit)
    .lean();

  // 2. Fetch trending pool metadata (sorted by precomputed trendingScore)
  const trendingCutoff = new Date(snapshotTimestamp - CONFIG.trendingCutoffDays * 24 * 60 * 60 * 1000);
  const trendingPoolPromise = Post.find(
    {
      ...baseQuery,
      createdAt: {
        $gte: trendingCutoff,
        $lte: new Date(snapshotTimestamp)
      }
    },
    { _id: 1, authorEmail: 1, clubId: 1, postAs: 1 }
  )
    .sort({ trendingScore: -1, _id: -1 })
    .limit(trendingPoolLimit)
    .lean();

  // 3. Fetch random pool metadata using a seeded random historical date range
  const intSeed = Math.floor(seed * 4294967296);
  const rand = mulberry32(intSeed);
  const archiveStart = new Date(snapshotTimestamp - CONFIG.archiveStartMs);
  const rangeWidth = trendingCutoff.getTime() - archiveStart.getTime();
  const randomTime = archiveStart.getTime() + (rangeWidth > 0 ? rand() * rangeWidth : 0);
  const randomDate = new Date(randomTime);

  const randomPoolPromise = Post.find(
    {
      ...baseQuery,
      createdAt: { $lt: randomDate },
      $or: [
        { likeCount: { $gt: 0 } },
        { "comments.0": { $exists: true } },
        { "poll.totalVotes": { $gt: 0 } }
      ]
    },
    { _id: 1, authorEmail: 1, clubId: 1, postAs: 1 }
  )
    .sort({ createdAt: -1 })
    .limit(randomPoolLimit)
    .lean();

  // Await all metadata pools in parallel
  const [newestPool, trendingPool, randomPoolRaw] = await Promise.all([
    newestPoolPromise,
    trendingPoolPromise,
    randomPoolPromise
  ]);

  // Deterministically shuffle the random pool in memory
  const randomPool = [...randomPoolRaw];
  for (let i = randomPool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [randomPool[i], randomPool[j]] = [randomPool[j], randomPool[i]];
  }

  // Blend categories according to the 70% newest, 20% trending, 10% random pattern
  const blendPattern = ['newest', 'trending', 'newest', 'newest', 'random', 'newest', 'newest', 'trending', 'newest', 'newest'];
  
  const seenIds = new Set();
  const mergedFeed = [];
  
  let pNewest = 0;
  let pTrending = 0;
  let pRandom = 0;

  const getPostKey = (post) => {
    if (post.postAs === "club" && post.clubId) {
      return `club_${post.clubId}`;
    }
    return `user_${post.authorEmail || post.authorName || post._id.toString()}`;
  };

  const findInPool = (pool, pointer, checkConsecutive = true) => {
    let tempPtr = pointer;
    while (tempPtr < pool.length) {
      const post = pool[tempPtr];
      const idStr = post._id.toString();
      
      if (seenIds.has(idStr)) {
        tempPtr++;
        continue;
      }

      if (checkConsecutive && mergedFeed.length >= 2) {
        const key = getPostKey(post);
        const prev1 = getPostKey(mergedFeed[mergedFeed.length - 1]);
        const prev2 = getPostKey(mergedFeed[mergedFeed.length - 2]);
        if (key === prev1 && key === prev2) {
          // Skip for now due to consecutiveness
          tempPtr++;
          continue;
        }
      }

      return { post, nextPointer: tempPtr };
    }
    return null;
  };

  // Fill blended slots up to totalNeeded
  for (let k = 0; k < totalNeeded; k++) {
    const targetCategory = blendPattern[k % blendPattern.length];
    let selected = null;

    // Phase 1: Try target category with consecutive check
    if (targetCategory === 'newest') {
      selected = findInPool(newestPool, pNewest, true);
      if (selected) pNewest = selected.nextPointer + 1;
    } else if (targetCategory === 'trending') {
      selected = findInPool(trendingPool, pTrending, true);
      if (selected) pTrending = selected.nextPointer + 1;
    } else if (targetCategory === 'random') {
      selected = findInPool(randomPool, pRandom, true);
      if (selected) pRandom = selected.nextPointer + 1;
    }

    // Phase 2: If target category was empty/consecutive-blocked, try other pools with consecutive check
    if (!selected) {
      selected = findInPool(newestPool, pNewest, true);
      if (selected) pNewest = selected.nextPointer + 1;
    }
    if (!selected) {
      selected = findInPool(trendingPool, pTrending, true);
      if (selected) pTrending = selected.nextPointer + 1;
    }
    if (!selected) {
      selected = findInPool(randomPool, pRandom, true);
      if (selected) pRandom = selected.nextPointer + 1;
    }

    // Phase 3: Fallback - ignore consecutive checks for the target category
    if (!selected) {
      if (targetCategory === 'newest') {
        selected = findInPool(newestPool, pNewest, false);
        if (selected) pNewest = selected.nextPointer + 1;
      } else if (targetCategory === 'trending') {
        selected = findInPool(trendingPool, pTrending, false);
        if (selected) pTrending = selected.nextPointer + 1;
      } else if (targetCategory === 'random') {
        selected = findInPool(randomPool, pRandom, false);
        if (selected) pRandom = selected.nextPointer + 1;
      }
    }

    // Phase 4: Ultimate fallback - ignore consecutive checks on any category pool
    if (!selected) {
      selected = findInPool(newestPool, pNewest, false);
      if (selected) pNewest = selected.nextPointer + 1;
    }
    if (!selected) {
      selected = findInPool(trendingPool, pTrending, false);
      if (selected) pTrending = selected.nextPointer + 1;
    }
    if (!selected) {
      selected = findInPool(randomPool, pRandom, false);
      if (selected) pRandom = selected.nextPointer + 1;
    }

    // Break if all pools are completely exhausted
    if (!selected) {
      break;
    }

    seenIds.add(selected.post._id.toString());
    mergedFeed.push(selected.post);
  }

  // Get metadata items for the current page
  const pageMetadata = mergedFeed.slice(offset, offset + limit);
  const hasMore = mergedFeed.length > offset + limit;

  const targetIds = pageMetadata.map(p => p._id);
  
  // Load full documents for target page
  const fullPosts = await Post.find({ _id: { $in: targetIds } }).lean();
  
  // Maintain the blended order in memory
  const fullPostsMap = new Map(fullPosts.map(p => [p._id.toString(), p]));
  const orderedPosts = targetIds.map(id => fullPostsMap.get(id.toString())).filter(Boolean);

  const nextCursor = hasMore ? encodeFeedCursor(snapshotTimestamp, seed, offset + orderedPosts.length) : null;

  return {
    posts: orderedPosts,
    nextCursor,
    hasMore
  };
}
