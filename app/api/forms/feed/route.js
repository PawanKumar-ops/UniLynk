import mongoose from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import Club from "@/models/Club";
import ResponseModel from "@/models/Response";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 30;

/**
 * Paginated events feed for the Events page.
 * GET /api/forms/feed?limit=10&cursor=<lastId>&genre=<genre>
 * Returns { events, nextCursor, genres? } where each event already includes
 * `registered` and `applied`, so the client makes a single request per page.
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit"), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );
    const cursor = searchParams.get("cursor");
    const genre = searchParams.get("genre");

    const session = await auth();
    const email = session?.user?.email?.toLowerCase?.().trim?.() || "";

    // Visibility: public events + members-only events of clubs the user belongs to.
    const visibility = [{ isPublished: true, isPublic: true }];
    if (email) {
      const memberClubs = await Club.find({
        $or: [{ "leaders.email": email }, { "members.email": email }],
      })
        .select("_id")
        .lean();
      if (memberClubs.length) {
        visibility.push({
          isPublished: true,
          isPublic: false,
          visibility: "members",
          clubId: { $in: memberClubs.map((c) => c._id) },
        });
      }
    }

    const baseFilter = { $or: visibility };
    const pageFilter = { ...baseFilter };
    if (genre && genre !== "All") pageFilter.genre = genre;
    if (cursor && mongoose.isValidObjectId(cursor)) {
      pageFilter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    // Fetch one extra to know whether another page exists.
    const [docs, genres] = await Promise.all([
      Form.find(pageFilter)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .select("-questions -adminTeams")
        .populate("clubId", "clubName logo")
        .lean(),
      cursor ? null : Form.distinct("genre", baseFilter).catch(() => []),
    ]);

    const hasMore = docs.length > limit;
    const events = hasMore ? docs.slice(0, limit) : docs;
    const ids = events.map((e) => e._id);

    // Batch registration counts and applied status (2 queries instead of 2N).
    const [counts, mine] = await Promise.all([
      ids.length
        ? ResponseModel.aggregate([
            { $match: { formId: { $in: ids } } },
            { $group: { _id: "$formId", n: { $sum: 1 } } },
          ])
        : [],
      email && ids.length
        ? ResponseModel.find({ formId: { $in: ids }, userEmail: email })
            .select("formId isSubmitted submittedAt")
            .lean()
        : [],
    ]);

    const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
    const appliedSet = new Set(
      mine.filter((r) => r.isSubmitted || r.submittedAt).map((r) => String(r.formId))
    );

    const body = {
      events: events.map((e) => ({
        ...e,
        registered: countMap.get(String(e._id)) || 0,
        applied: appliedSet.has(String(e._id)),
      })),
      nextCursor: hasMore ? String(events[events.length - 1]._id) : null,
    };
    if (genres) {
      body.genres = genres.filter((g) => typeof g === "string" && g.trim());
    }

    return Response.json(body, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    console.error("EVENTS FEED ERROR:", error);
    return Response.json({ error: "Failed to load events" }, { status: 500 });
  }
}
