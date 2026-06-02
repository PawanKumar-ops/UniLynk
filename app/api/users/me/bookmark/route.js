import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';
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

    const user = await User.findOne({ email: userEmail });
    if (!user) return new Response('User not found', { status: 404 });

    const alreadySaved = user.savedPosts.some(
      (id) => id.toString() === postId.toString()
    );

    if (alreadySaved) {
      // unsave
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId.toString()
      );
    } else {
      // save
      user.savedPosts.push(postId);
    }
    await user.save();
    return new Response(JSON.stringify({ saved: !alreadySaved }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bookmark toggle error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
