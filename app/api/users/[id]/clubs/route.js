import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Club from "@/models/Club";
import User from "@/models/user";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getYearFromValue = (value) => {
  if (!value) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  const text = String(value).trim();
  if (!text) return "";

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return yearMatch[0];

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return String(date.getFullYear());
  }

  return text;
};

const getMemberJoinYear = (record, club) => (
  getYearFromValue(record?.joiningYear) ||
  getYearFromValue(record?.joinedYear) ||
  getYearFromValue(record?.joinedAt) ||
  getYearFromValue(record?.createdAt) ||
  getYearFromValue(club?.createdAt)
);

export async function GET(_req, { params }) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ message: "Invalid user id" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id).select("email").lean();

    if (!user?.email) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    const userEmail = normalizeEmail(user.email);

    const clubs = await Club.find({
      $or: [
        { "leaders.email": userEmail },
        { "members.email": userEmail },
      ],
    })
      .sort({ updatedAt: -1 })
      .select("clubName banner logo leaders members memberCount createdAt updatedAt")
      .lean();

    const userClubs = clubs.map((club) => {
      const leaders = Array.isArray(club.leaders) ? club.leaders : [];
      const members = Array.isArray(club.members) ? club.members : [];
      const leader = leaders.find((item) => normalizeEmail(item?.email) === userEmail);
      const member = members.find((item) => normalizeEmail(item?.email) === userEmail);
      const uniqueMemberEmails = new Set();

      leaders.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) uniqueMemberEmails.add(email);
      });

      members.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) uniqueMemberEmails.add(email);
      });

      const totalMembers = Math.max(uniqueMemberEmails.size, Number(club.memberCount) || 0);
      const leaderCount = leaders.filter((item) => normalizeEmail(item?.email)).length;
      const roleRecord = leader || member || {};

      return {
        _id: club._id?.toString(),
        clubName: club.clubName,
        logo: club.logo || "",
        banner: club.banner || "",
        memberCount: totalMembers,
        leaderCount,
        position: leader?.position || member?.position || "Member",
        joiningYear: getMemberJoinYear(roleRecord, club),
      };
    });

    return Response.json({ clubs: userClubs }, { status: 200 });
  } catch (error) {
    console.error("FETCH USER CLUBS ERROR:", error);
    return Response.json({ message: "Failed to fetch user clubs" }, { status: 500 });
  }
}
