import { connectDB } from '@/lib/mongodb';
import User from '@/models/user';

export async function GET(req) {
  try {
    await connectDB();
    // Fetch basic user info for suggestion list
    const users = await User.find()
      .select('_id name year branch clubs img')
      .lean();
    // Return in same shape expected by frontend
    return Response.json({ users }, { status: 200 });
  } catch (error) {
    console.error('GET ALL USERS ERROR:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
