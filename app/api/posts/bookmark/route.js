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

    // Find the post to ensure it exists.
    const post = await Post.findById(postId).lean();
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    // Load the user document.
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const postObjectId = post._id;
    const alreadySaved = user.savedPosts?.some((id) => id.equals(postObjectId));

    if (alreadySaved) {
      // Remove from savedPosts.
      user.savedPosts = user.savedPosts.filter((id) => !id.equals(postObjectId));
    } else {
      // Add to savedPosts.
      user.savedPosts = user.savedPosts ? [...user.savedPosts, postObjectId] : [postObjectId];
    }

    await user.save();

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
