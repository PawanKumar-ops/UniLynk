import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import Club from "@/models/Club";
import ResponseModel from "@/models/Response";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const clubId = url.searchParams.get("clubId");

    const session = await getServerSession(authOptions);
    const normalizedEmail = session?.user?.email?.toLowerCase?.().trim?.() || "";

    const publicFilter = { isPublished: true, isPublic: true };
    if (clubId) {
      publicFilter.clubId = clubId;
    }
    const publicForms = await Form.find(publicFilter).populate("clubId", "clubName logo").lean();

    const attachResponseCounts = async (formsList) => {
      return Promise.all(
        formsList.map(async (form) => {
          const registered = await ResponseModel.countDocuments({ formId: form._id });
          return {
            ...form,
            registered,
          };
        })
      );
    };

    if (!normalizedEmail) {
      const results = await attachResponseCounts(publicForms);
      return Response.json(results);
    }

    const memberClubFilter = {
      $or: [{ "leaders.email": normalizedEmail }, { "members.email": normalizedEmail }],
    };
    if (clubId) {
      memberClubFilter._id = clubId;
    }

    const memberClubIds = await Club.find(memberClubFilter)
      .select("_id")
      .lean();

    const clubIds = memberClubIds.map((club) => club._id);

    const membersOnlyFilter = {
      isPublished: true,
      isPublic: false,
      visibility: "members",
      clubId: { $in: clubIds },
    };

    const membersOnlyForms = await Form.find(membersOnlyFilter).populate("clubId", "clubName logo").lean();

    const allForms = [...publicForms, ...membersOnlyForms];
    const results = await attachResponseCounts(allForms);

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
