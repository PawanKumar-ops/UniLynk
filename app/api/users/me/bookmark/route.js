import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';
import Post from '@/models/post';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    await connectDB();
    const { postId } = await req.json();
    if (!postId) return new Response('postId required', { status: 400 });

    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return new Response('Unauthorized', { status: 401 });

    const [user, post] = await Promise.all([
      User.findOne({ email: userEmail }, { savedPosts: 1 }),
      Post.findById(postId, { _id: 1 }),
    ]);
    if (!user) return new Response('User not found', { status: 404 });
    if (!post) return new Response('Post not found', { status: 404 });

    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === post._id.toString()
    );
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

      try {
        const { updatePostTrendingScore } = await import('@/lib/feedRanking');
        updatePostTrendingScore(post._id.toString()).catch((err) =>
          console.error(`Error updating trending score for post ${postId} on bookmark:`, err)
        );
      } catch (err) {
        console.error('Failed to import/run trending score updates for bookmark:', err);
      }
    }

    return new Response(JSON.stringify({ saved: !alreadySaved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
