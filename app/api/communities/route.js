// app/api/communities/route.js  (save as .js in your project)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect"; // adjust to your db helper
import Community from "@/models/Community";
import { getCurrentUserId } from "@/lib/auth"; // adjust to your auth helper

export async function GET() {
  try {
    await dbConnect();
    const currentUserId = await getCurrentUserId();

    const communities = await Community.find({})
      .populate("clubId", "name image email")
      .populate("members", "name image email")
      .populate("admins", "name image")
      .lean();

    const shaped = communities.map((c) => ({
      id: String(c._id),
      name: c.name,
      description: c.description,
      image: c.image || c.clubId?.image || "",
      clubId: c.clubId ? String(c.clubId._id) : "",
      clubName: c.clubId?.name || "",
      memberCount: c.members?.length || 0,
      isMember: (c.members || []).some(
        (m) => String(m._id) === String(currentUserId)
      ),
      isAdmin: (c.admins || []).some(
        (m) => String(m._id) === String(currentUserId)
      ),
      members: (c.members || []).map((m) => ({
        id: String(m._id),
        name: m.name,
        image: m.image || "",
        email: m.email || "",
      })),
      groups: (c.groups || []).map((g) => ({
        id: String(g._id),
        name: g.name,
        description: g.description || "",
        image: g.image || "",
        memberCount: (g.members || []).length,
        isAnnouncement: !!g.isAnnouncement,
        updatedAt: g.updatedAt,
      })),
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ communities: shaped, currentUserId });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to load communities" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const currentUserId = await getCurrentUserId();
    const { name, description, image, memberIds = [] } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const allMembers = Array.from(new Set([String(currentUserId), ...memberIds]));

    const community = await Community.create({
      name,
      description,
      image,
      clubId: currentUserId,
      admins: [currentUserId],
      members: allMembers,
      groups: [
        {
          name: "Announcements",
          description: "Important updates from admins",
          isAnnouncement: true,
          createdBy: currentUserId,
          members: allMembers,
        },
        {
          name: "General",
          description: "Chat with everyone",
          createdBy: currentUserId,
          members: allMembers,
        },
      ],
    });

    return NextResponse.json({ ok: true, id: String(community._id) });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to create community" },
      { status: 500 }
    );
  }
}
