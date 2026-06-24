import { connectDB } from '@/lib/mongodb';
import ResponseModel from '@/models/Response';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

/**
 * GET /api/forms/submission?formId=xxxxx
 * Returns the submission (Response document) for the logged‑in user for the given form.
 */
export async function GET(req) {
  try {
    // Connect to DB
    await connectDB();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const viewerEmail = session.user.email.toLowerCase();

    // Extract formId from query string
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');
    if (!formId) {
      return NextResponse.json({ error: 'Missing formId' }, { status: 400 });
    }

    // Find the submission belonging to this user
    const submission = await ResponseModel.findOne({
      formId,
      userEmail: viewerEmail,
    }).lean();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Return the submission (including answers, teamFinder, etc.)
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
