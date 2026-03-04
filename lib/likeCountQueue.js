import Post from "@/models/post";

const queueState = global.__likeCountQueueState || {
  pendingByPostId: new Map(),
  flushing: false,
};
global.__likeCountQueueState = queueState;

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
          update: {
            ...(delta > 0 ? { $inc: { likeCount: delta } } : {}),
            ...(delta < 0 ? { $inc: { likeCount: delta }, $max: { likeCount: 0 } } : {}),
          },
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
      setTimeout(() => {
        void flushQueue();
      }, 50);
    }
  }
};

export const enqueueLikeCountSync = (postId, delta) => {
  const current = queueState.pendingByPostId.get(postId) || 0;
  queueState.pendingByPostId.set(postId, current + delta);

  setTimeout(() => {
    void flushQueue();
  }, 25);
};
