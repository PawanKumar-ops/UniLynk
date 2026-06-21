import { connectDB } from "@/lib/mongodb";
import Post from "@/models/post";
import User from "@/models/user";
import Comment from "@/models/comment";
import Club from "@/models/Club";
import PostLike from "@/models/postLike";
import { getLikeCounts } from "@/lib/postLikeCache";
import { parseLegacyPollContent } from "@/lib/polls";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getHybridFeedPosts, decodeFeedCursor } from "@/lib/feedRanking";


const DEFAULT_POST_LIMIT = 15;
const MAX_POST_LIMIT = 50;

const encodePostCursor = (post) => {
  if (!post?.createdAt || !post?._id) return null;

  return Buffer.from(
    JSON.stringify({
      createdAt: new Date(post.createdAt).toISOString(),
      id: post._id.toString(),
    }),
  ).toString("base64url");
};

const decodePostCursor = (cursor) => {
  if (typeof cursor !== "string" || !cursor.trim()) return null;

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    const createdAt = new Date(parsed?.createdAt);
    const id = typeof parsed?.id === "string" ? parsed.id.trim() : "";

    if (Number.isNaN(createdAt.getTime()) || !/^[a-f\d]{24}$/i.test(id)) return null;

    return { createdAt, id };
  } catch {
    return null;
  }
};

const normalizeEmail = (email) => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const normalizeName = (name) => {
  if (typeof name !== "string") return "";
  return name.trim().toLowerCase();
};

const normalizeImage = (image) => {
  if (typeof image !== "string") return "";

  const cleaned = image.trim();
  if (!cleaned) return "";

  const lowered = cleaned.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  return cleaned;
};

const buildAvatarFallback = (name) => {
  const safeName = typeof name === "string" && name.trim() ? name.trim() : "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName
  )}&background=random&color=fff&size=128&bold=true`;
};

const resolvePostAuthorImages = async (posts) => {
  const emails = [...new Set(posts.map((post) => normalizeEmail(post.authorEmail)).filter(Boolean))];
  const namesRaw = [...new Set(posts.map((post) => (typeof post.authorName === "string" ? post.authorName.trim() : "")).filter(Boolean))];

  const users = await User.find(
    {
      $or: [
        ...(emails.length ? [{ email: { $in: emails } }] : []),
        ...(namesRaw.length ? [{ name: { $in: namesRaw } }] : []),
      ],
    },
    { email: 1, name: 1, img: 1 }
  ).lean();

  const userByEmail = new Map();
  const userByName = new Map();

  for (const user of users) {
    const email = normalizeEmail(user.email);
    const name = normalizeName(user.name);

    if (email) userByEmail.set(email, user);
    if (name && !userByName.has(name)) userByName.set(name, user);
  }

  return posts.map((post) => {
    const email = normalizeEmail(post.authorEmail);
    const name = normalizeName(post.authorName);
    const matchedUser = userByEmail.get(email) || userByName.get(name);
    const liveUserImage = normalizeImage(matchedUser?.img);
    const storedImage = normalizeImage(post.authorImage);

    return {
      ...post,
      authorId: matchedUser?._id?.toString?.() || "",
      authorEmail: email,
      authorImage: liveUserImage || storedImage || buildAvatarFallback(post.authorName),
    };
  });
};


const resolveLikeState = async (posts, userId) => {
  if (!posts.length) return [];

  const postIds = posts.map((post) => post._id.toString());
  const [likes, likeCountsById] = await Promise.all([
    userId
      ? PostLike.find({ postId: { $in: postIds }, userId }, { postId: 1 }).lean()
      : [],
    getLikeCounts(posts),
  ]);
  const likedPostIds = new Set(likes.map((like) => like.postId.toString()));

  return posts.map((post) => {
    const postId = post._id.toString();
    return {
      ...post,
      likeCount: likeCountsById.get(postId) ?? Number(post.likeCount || 0),
      likedByCurrentUser: likedPostIds.has(postId),
    };
  });
};

const attachRecentComments = async (posts) => {
  if (!posts.length) return [];

  const postIds = posts.map((post) => post._id);
  const comments = await Comment.find(
    { postId: { $in: postIds } },
    { postId: 1, content: 1, authorName: 1, authorEmail: 1, authorImage: 1, images: 1, createdAt: 1, updatedAt: 1 }
  )
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const commentsByPostId = new Map();
  for (const comment of comments) {
    const key = comment.postId.toString();
    const current = commentsByPostId.get(key) || [];
    current.push(comment);
    commentsByPostId.set(key, current);
  }

  return posts.map((post) => ({
    ...post,
    comments: commentsByPostId.get(post._id.toString()) || [],
  }));
};

const normalizePollForUser = (poll, userId) => {
  if (!poll || !Array.isArray(poll.options)) return undefined;

  const votedOptionId = userId
    ? poll.votes?.find((vote) => vote.userId?.toString?.() === userId)?.optionId || null
    : null;

  return {
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      votes: Number(option.votes || 0),
    })),
    totalVotes: Number(poll.totalVotes || 0),
    endsAt: poll.endsAt instanceof Date ? poll.endsAt.toISOString() : poll.endsAt,
    votedOptionId,
  };
};

const normalizePosts = (posts, userId = null) =>
  posts.map((post) => ({
    ...post,
    id: post.id ?? post._id?.toString?.() ?? String(post._id || ""),
    comments: Array.isArray(post.comments)
      ? post.comments.map((comment) => ({
          ...comment,
          id: comment.id ?? comment._id?.toString?.() ?? String(comment._id || ""),
        }))
      : [],
    commentCount: Number(post.commentCount ?? (Array.isArray(post.comments) ? post.comments.length : 0)),
    bookmarkCount: Number(post.bookmarkCount || 0),
    poll: normalizePollForUser(post.poll, userId),
  }));

const markDeletePermissions = async (posts, sessionEmail) => {
  if (!posts.length) return posts;

  const normalizedSessionEmail = normalizeEmail(sessionEmail);
  const clubIds = [
    ...new Set(
      posts
        .filter((post) => post.postAs === "club" && post.clubId)
        .map((post) => String(post.clubId))
    ),
  ];

  const clubs = clubIds.length && normalizedSessionEmail
    ? await Club.find(
        { _id: { $in: clubIds } },
        { leaders: 1 }
      ).lean()
    : [];
  const leaderClubIds = new Set(
    clubs
      .filter((club) =>
        (club.leaders || []).some(
          (leader) => normalizeEmail(leader?.email) === normalizedSessionEmail
        )
      )
      .map((club) => club._id.toString())
  );

  return posts.map((post) => {
    const authorEmail = normalizeEmail(post.authorEmail);
    const isAuthor = Boolean(normalizedSessionEmail && authorEmail === normalizedSessionEmail);
    const isClubLeader = Boolean(
      post.postAs === "club" &&
      post.clubId &&
      leaderClubIds.has(String(post.clubId))
    );

    return {
      ...post,
      canDeleteByCurrentUser: isAuthor || isClubLeader,
    };
  });
};

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const audience = searchParams.get("audience");
    const clubId = searchParams.get("clubId");
    const sort = searchParams.get("sort");
    const cursor = decodePostCursor(searchParams.get("cursor"));
    const requestedLimitParam = searchParams.get("limit");
    const requestedLimit = Number(requestedLimitParam || DEFAULT_POST_LIMIT);
    const limit = requestedLimitParam || cursor
      ? Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.floor(requestedLimit), MAX_POST_LIMIT)
        : DEFAULT_POST_LIMIT
      : 0;

    const query = {
      ...(clubId ? { clubId: clubId.trim() } : {}),
      ...(
      audience === "for-you" || audience === "clubs"
        ? { visibility: audience }
        : {}
      ),
    };

    const sortQuery = sort === "top"
      ? { likeCount: -1, createdAt: -1, _id: -1 }
      : { createdAt: -1, _id: -1 };

    let paginatedPosts;
    let nextCursor;
    let hasMore;

    if (sort === "top") {
      const cursor = decodePostCursor(searchParams.get("cursor"));
      if (cursor) {
        query.$or = [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
        ];
      }
      let postsQuery = Post.find(query).sort(sortQuery);
      if (limit) postsQuery = postsQuery.limit(limit + 1);

      const posts = await postsQuery.lean();
      hasMore = limit ? posts.length > limit : false;
      paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
      nextCursor = hasMore ? encodePostCursor(paginatedPosts[paginatedPosts.length - 1]) : null;
    } else {
      const cursor = decodeFeedCursor(searchParams.get("cursor"));
      const resolvedLimit = limit > 0 ? limit : DEFAULT_POST_LIMIT;
      const result = await getHybridFeedPosts(query, resolvedLimit, cursor);
      paginatedPosts = result.posts;
      nextCursor = result.nextCursor;
      hasMore = result.hasMore;
    }

    const hydratedPosts = await resolvePostAuthorImages(paginatedPosts);

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);
    const user = sessionEmail
      ? await User.findOne({ email: sessionEmail }, { _id: 1, savedPosts: 1 }).lean()
      : null;

    const postsWithPermissions = await markDeletePermissions(hydratedPosts, sessionEmail);
    const postsWithComments = await attachRecentComments(postsWithPermissions);
    const enrichedPosts = await resolveLikeState(postsWithComments, user?._id?.toString());
    const savedPostIds = new Set(user?.savedPosts?.map(id => id.toString()) || []);
    const enrichedPostsWithSave = enrichedPosts.map(post => ({
      ...post,
      savedByCurrentUser: savedPostIds.has(post._id.toString()),
    }));
    const normalizedPosts = normalizePosts(enrichedPostsWithSave, user?._id?.toString());

    return Response.json(
      { posts: normalizedPosts, nextCursor, hasMore },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req) {
  try {
    const {
      content,
      audience,
      authorName,
      authorImage,
      authorEmail,
      images = [],
      postAs = "user",
      clubId = "",
      poll,
    } = await req.json();

    const initialContent = content?.trim() || "";
    const legacyPoll = !poll ? parseLegacyPollContent(initialContent) : null;
    const safeContent = legacyPoll?.content ?? initialContent;
    const safeImages = Array.isArray(images)
      ? images
          .filter((image) => typeof image === "string" && image.trim())
          .map((image) => image.trim())
          .slice(0, 4)
      : [];

    const normalizedPollOptions = Array.isArray(poll?.options)
      ? poll.options
          .map((option) => (typeof option === "string" ? option : option?.text))
          .filter((option) => typeof option === "string" && option.trim())
          .map((option) => option.trim())
          .slice(0, 4)
      : [];
    const hasPoll = normalizedPollOptions.length >= 2;

    if (!safeContent && safeImages.length === 0 && !hasPoll) {
      return new Response("Post content, image, or poll is required", { status: 400 });
    }

    if (poll && !hasPoll) {
      return Response.json({ error: "Poll must include at least 2 options" }, { status: 400 });
    }

    const requestedPollDays = Number(poll?.durationDays || poll?.days);
    const safePollDays = Number.isFinite(requestedPollDays)
      ? Math.min(Math.max(Math.floor(requestedPollDays), 1), 7)
      : 1;
    const normalizedPoll = hasPoll
      ? {
          options: normalizedPollOptions.map((text, index) => ({
            id: `option-${index + 1}`,
            text,
            votes: 0,
          })),
          totalVotes: 0,
          endsAt: new Date(Date.now() + safePollDays * 24 * 60 * 60 * 1000),
          votes: [],
        }
      : undefined;

    const safeAudience = audience === "clubs" ? "clubs" : "for-you";


    await connectDB();

    const session = await getServerSession(authOptions);
    const sessionEmail = normalizeEmail(session?.user?.email);

    const safeAuthorEmail = normalizeEmail(authorEmail) || sessionEmail;
    const safeAuthorName = authorName?.trim() || session?.user?.name?.trim() || "UniLynk User";

    let safeAuthorImage = normalizeImage(authorImage) || normalizeImage(session?.user?.image);

    let dbUser = null;
    if (safeAuthorEmail) {
      dbUser = await User.findOne({ email: safeAuthorEmail }, { img: 1, name: 1 }).lean();
      safeAuthorImage = normalizeImage(dbUser?.img) || safeAuthorImage;
    }

    safeAuthorImage = safeAuthorImage || buildAvatarFallback(safeAuthorName);

    const normalizedPostAs = postAs === "club" ? "club" : "user";
    const requestedClubId = typeof clubId === "string" ? clubId.trim() : "";
    let postAuthorName = safeAuthorName;
    let postAuthorImage = safeAuthorImage;
    let postClubId = "";
    let postVisibility = [safeAudience];

    if (normalizedPostAs === "club") {
      if (!sessionEmail) {
        return new Response("Unauthorized", { status: 401 });
      }

      const club = await Club.findOne(
        { _id: requestedClubId, "leaders.email": sessionEmail },
        { _id: 1, clubName: 1, logo: 1 }
      ).lean();

      if (!club) {
        return new Response("You are not authorized to post as this club", { status: 403 });
      }

      postAuthorName = club.clubName || safeAuthorName;
      postAuthorImage = normalizeImage(club.logo) || safeAuthorImage;
      postClubId = club._id.toString();
      postVisibility = ["for-you", "clubs"];
    }

    const post = await Post.create({
      content: safeContent,
      audience: safeAudience,
      visibility: postVisibility,
      postAs: normalizedPostAs,
      clubId: postClubId,
      authorName: postAuthorName,
      authorEmail: safeAuthorEmail,
      authorImage: postAuthorImage,
      images: safeImages,
      poll: normalizedPoll,
    });

    const normalizedPost = {
      ...post.toObject(),
      id: post._id.toString(),
      authorId: dbUser?._id?.toString?.() || "",
      comments: [],
      commentCount: 0,
      canDeleteByCurrentUser: Boolean(sessionEmail),
      poll: normalizePollForUser(post.poll, null),
    };

    return Response.json({ post: normalizedPost }, { status: 201 });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
