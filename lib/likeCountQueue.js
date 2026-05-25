import Post from "@/models/post";

const queueState = global.__likeCountQueueState || {
  pendingByPostId: new Map(),
  flushing: false,
  timer: null,
};
global.__likeCountQueueState = queueState;

const scheduleFlush = (delayMs = 25) => {
  if (queueState.timer) return;

  queueState.timer = setTimeout(() => {
    queueState.timer = null;
    void flushQueue();
  }, delayMs);
};

const flushQueue = async () => {
  if (queueState.flushing || queueState.pendingByPostId.size === 0) return;

  queueState.flushing = true;

  try {
    const pending = Array.from(queueState.pendingByPostId.entries());
    queueState.pendingByPostId.clear();

    const operations = pending
      .filter(([, delta]) => delta !== 0)
      .map(([postId, delta]) => ({
        updateOne: {
          filter: { _id: postId },
          // Use a pipeline update to avoid operator conflicts on likeCount
          // ($inc + $max on same path throws MongoBulkWriteError code 40).
          update: [
            {
              $set: {
                likeCount: {
                  $max: [0, { $add: [{ $ifNull: ["$likeCount", 0] }, delta] }],
                },
              },
            },
          ],
        },
      }));

    if (operations.length) {
      await Post.bulkWrite(operations, { ordered: false });
    }
  } catch (error) {
    console.error("LIKE COUNT QUEUE FLUSH ERROR:", error);
  } finally {
    queueState.flushing = false;

    if (queueState.pendingByPostId.size > 0) {
      scheduleFlush(50);
    }
  }
};

export const enqueueLikeCountSync = (postId, delta) => {
  const current = queueState.pendingByPostId.get(postId) || 0;
  queueState.pendingByPostId.set(postId, current + delta);

  scheduleFlush(25);
};
