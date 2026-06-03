// app/api/communities/[id]/groups/route.js  (save as .js in your project)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Community from "@/models/Community";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(req, { params }) {
  try {
    await dbConnect();
    const currentUserId = await getCurrentUserId();
    const { name, description = "", image = "", memberIds = [] } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Group name required" }, { status: 400 });
    }

    const community = await Community.findById(params.id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const allMembers = Array.from(new Set([String(currentUserId), ...memberIds]));

    community.groups.push({
      name: name.trim(),
      description,
      image,
      members: allMembers,
      createdBy: currentUserId,
      isAnnouncement: false,
    });

    await community.save();

    const newGroup = community.groups[community.groups.length - 1];

    return NextResponse.json({
      ok: true,
      group: {
        id: String(newGroup._id),
        name: newGroup.name,
        description: newGroup.description,
        image: newGroup.image,
        memberCount: newGroup.members.length,
        isAnnouncement: false,
        updatedAt: newGroup.updatedAt,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to create group" },
      { status: 500 }
    );
  }
}
