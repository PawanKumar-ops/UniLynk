import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import Club from "@/models/Club";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const normalizedEmail = session?.user?.email?.toLowerCase?.().trim?.() || "";

    const publicForms = await Form.find({ isPublished: true, isPublic: true }).lean();

    if (!normalizedEmail) {
      return Response.json(publicForms);
    }

    const memberClubIds = await Club.find({
      $or: [{ "leaders.email": normalizedEmail }, { "members.email": normalizedEmail }],
    })
      .select("_id")
      .lean();

    const clubIds = memberClubIds.map((club) => club._id);

    const membersOnlyForms = await Form.find({
      isPublished: true,
      isPublic: false,
      visibility: "members",
      clubId: { $in: clubIds },
    }).lean();

    return Response.json([...publicForms, ...membersOnlyForms]);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
