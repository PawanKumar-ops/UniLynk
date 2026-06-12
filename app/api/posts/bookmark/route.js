import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';
import Post from '@/models/post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST /api/posts/bookmark
// Toggles saved status of a post for the authenticated user.
export async function POST(req) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId || typeof postId !== 'string') {
      return Response.json({ error: 'Invalid postId' }, { status: 400 });
    }

    const post = await Post.findById(postId, { _id: 1, bookmarkCount: 1 }).lean();
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email }, { savedPosts: 1 });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const alreadySaved = user.savedPosts?.some((id) => id.equals(post._id));
    const userUpdate = alreadySaved
      ? { $pull: { savedPosts: post._id } }
      : { $addToSet: { savedPosts: post._id } };
    const userResult = await User.updateOne({ _id: user._id }, userUpdate);

    if (userResult.modifiedCount > 0) {
      await Post.updateOne(
        { _id: post._id },
        [
          {
            $set: {
              bookmarkCount: {
                $max: [0, { $add: [{ $ifNull: ['$bookmarkCount', 0] }, alreadySaved ? -1 : 1] }],
              },
            },
          },
        ]
      );
    }

    try {
      const { updatePostTrendingScore } = await import("@/lib/feedRanking");
      updatePostTrendingScore(postId).catch(err =>
        console.error(`Error updating trending score for post ${postId} on bookmark:`, err)
      );
    } catch (err) {
      console.error("Failed to import/run trending score updates for bookmark:", err);
    }

    return Response.json({ saved: !alreadySaved }, { status: 200 });
  } catch (error) {
    console.error('BOOKMARK ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
