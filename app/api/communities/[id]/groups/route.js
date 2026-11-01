import { auth } from "@/auth";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Community from "@/models/Community";
import User from "@/models/user";
import Club from "@/models/Club";
import cloudinary from "@/lib/cloudinary";
import { getUserIdentities, isClubLeader } from "@/lib/clubLeadership";

// Store uploaded group photos in Cloudinary rather than as base64 in the document.
async function persistGroupImage(image) {
  if (typeof image !== "string" || !image) return "";
  if (!image.startsWith("data:")) return image;
  try {
    const uploaded = await cloudinary.uploader.upload(image, { folder: "community-groups", transformation: [{ width: 400, height: 400, crop: "fill" }] });
    return uploaded.secure_url || "";
  } catch (error) {
    console.error("GROUP IMAGE UPLOAD ERROR:", error);
    return "";
  }
}

function uniqueValidIds(values = []) {
  const seen = new Set();
  return values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => {
      if (!mongoose.Types.ObjectId.isValid(value) || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() });
}

export async function POST(req, context) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid community id is required" }, { status: 400 });
    }

    const { name = "", description = "", image = "", memberIds = [] } = await req.json();
    const trimmedName = String(name || "").trim().slice(0, 80);

    if (!trimmedName) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const community = await Community.findById(id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = String(currentUser._id);
    const communityMemberIds = uniqueValidIds(community.members);
    const communityAdminIds = uniqueValidIds(community.admins);

    if (!communityMemberIds.includes(currentUserId)) {
      return NextResponse.json({ error: "You are not a member of this community" }, { status: 403 });
    }

    // Leadership comes from the club itself, so former leaders who are still
    // listed as community admins lose the ability to create groups.
    const club = community.clubId ? await Club.findById(community.clubId).select("leaders members").lean() : null;
    const identities = await getUserIdentities(currentUser.email);
    const isLeader = club ? isClubLeader(club, identities) : communityAdminIds.includes(currentUserId);
    if (!isLeader) {
      return NextResponse.json({ error: "Only the club's leadership team can create groups" }, { status: 403 });
    }

    const duplicate = (community.groups || []).some(
      (group) => String(group.name || "").trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json({ error: "A group with this name already exists" }, { status: 409 });
    }

    // Without an explicit member list, the group is open to the whole community.
    const requestedMemberIds = uniqueValidIds(Array.isArray(memberIds) ? memberIds : []);
    const groupMemberIds = uniqueValidIds([
      currentUserId,
      ...(requestedMemberIds.length ? requestedMemberIds : communityMemberIds),
    ]).filter((memberId) => communityMemberIds.includes(memberId));

    community.groups.push({
      name: trimmedName,
      description: String(description || "").trim(),
      image: await persistGroupImage(image),
      members: groupMemberIds,
      createdBy: currentUser._id,
      isAnnouncement: false,
    });

    await community.save();

    const newGroup = community.groups[community.groups.length - 1];

    return NextResponse.json({
      ok: true,
      group: {
        id: String(newGroup._id),
        name: newGroup.name,
        description: newGroup.description || "",
        image: newGroup.image || "",
        memberCount: newGroup.members.length,
        isAnnouncement: false,
        updatedAt: newGroup.updatedAt,
        lastMessage: "",
      },
    });
  } catch (error) {
    console.error("COMMUNITY GROUPS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
