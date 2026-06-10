import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  UserPlus,
  EllipsisVertical,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon } from "@iconify/react";
import ReliableImage from "./ReliableImage";
import CommentModal from "./CommentModal";
import ShareModal from "./ShareModal";
import { ReportPostModal } from "./ReportPostModal";
import { AllClubsModal } from "./AllClubsModal";

// Random club will be fetched from the API



const ImageWithFallback = ({ src, alt, className = "" }) => (
  <ReliableImage
    src={src}
    alt={alt}
    className={className}
    maxRetries={2}
    fallbackSrc="/Profilepic.png"
  />
);

const suggestedUserCardClass = "flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white";

const SuggestedUserSkeleton = () => (
  <div
    className={suggestedUserCardClass}
    aria-hidden="true"
  >
    <div className="w-12 h-12 rounded-full bg-neutral-100 shrink-0 animate-pulse" />
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="h-3.5 w-24 rounded-full bg-neutral-100 animate-pulse" />
      <div className="h-3 w-20 rounded-full bg-neutral-100 animate-pulse" />
      <div className="h-2.5 w-14 rounded-full bg-neutral-100 animate-pulse" />
    </div>
    <div className="h-7 w-[4.625rem] shrink-0 rounded-full bg-neutral-100 animate-pulse" />
  </div>
);

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const Loading = () => (
  <div className="userpostsloadani">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
      <div className="absolute inset-0 rounded-full border-3 border-black border-t-transparent animate-spin"></div>
    </div>
  </div>
);

const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const buildAvatarFallback = (name) => {
  const safeName = (name || "UniLynk User").trim() || "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff&size=128&bold=true`;
};

const normalizeComment = (comment, index = 0) => {
  if (!comment || typeof comment !== "object") return null;

  const candidateId = comment.id ?? comment._id ?? `comment-${index}`;
  const safeId = typeof candidateId === "string" ? candidateId.trim() : String(candidateId || "").trim();

  return {
    ...comment,
    id: safeId || `comment-${index}`,
    images: Array.isArray(comment.images)
      ? comment.images.filter((image) => typeof image === "string" && image.trim())
      : [],
  };
};

const normalizePost = (post) => {
  if (!post || typeof post !== "object") return null;

  const candidateId = post.id ?? post._id ?? post.postId;
  const safeId = typeof candidateId === "string" ? candidateId.trim() : "";

  if (!safeId) {
    console.error("Invalid post id:", candidateId);
    return null;
  }

  const normalizedComments = Array.isArray(post.comments)
    ? post.comments.map(normalizeComment).filter(Boolean)
    : [];

  return {
    ...post,
    id: safeId,
    comments: normalizedComments,
    commentCount: Number(post.commentCount ?? normalizedComments.length ?? 0),
  };
};

const likePost = async (postId, method) => {
  if (!postId || typeof postId !== "string" || !postId.trim()) {
    throw new Error("Attempted like without postId");
  }

  return fetch(`/api/posts/${postId}/like`, { method });
};

const getImageGridClass = (count) => {
  if (count <= 1) return "image-grid count-1";
  if (count === 2) return "image-grid count-2";
  if (count === 3) return "image-grid count-3";
  return "image-grid count-4";
};

const ParticipantAvatarStack = ({ event }) => {
  const avatars = Array.isArray(event.participantAvatars) ? event.participantAvatars : [];
  const count = Number(event.responseParticipantCount) || 0;

  if (count <= 3 || avatars.length < 3) return null;

  return (
    <div className="mb-3 flex items-center">
      {avatars.slice(0, 3).map((avatar, index) => (
        <div
          key={avatar.email || `${event.id}-avatar-${index}`}
          className={`relative w-7 h-7 rounded-full overflow-hidden border-2 border-zinc-900 bg-white shrink-0 ${index !== 0 ? "-ml-3" : ""}`}
          title={avatar.name}
        >
          <ImageWithFallback
            src={avatar.image || "/Profilepic.png"}
            alt={avatar.name || "Participant"}
            className="w-full h-full object-cover object-center"
          />
        </div>
      ))}

      <div className="relative w-7 h-7 -ml-3 rounded-full bg-zinc-700 border-2 border-zinc-900 flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-medium">+{count - 3}</span>
      </div>
    </div>
  );
};

const TrendingCard = ({ event, featured = false }) => (
  <article
    className={`${featured ? "row-span-2" : ""} relative rounded-2xl overflow-hidden border border-neutral-200 group cursor-pointer bg-neutral-100`}
  >
    <ImageWithFallback
      src={event.image}
      alt={event.title}
      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
    />
    <div className={`absolute inset-0 ${featured ? "bg-gradient-to-t from-black/80 via-black/20 to-transparent" : "bg-gradient-to-t from-black/75 to-transparent"}`} />
    <div className={`relative flex h-full flex-col justify-end text-white ${featured ? "min-h-72 p-4" : "min-h-36 p-3"}`}>
      <ParticipantAvatarStack event={event} />
      <div className={featured ? "text-sm leading-snug" : "text-xs leading-snug line-clamp-2"}>
        {event.title}
      </div>
      <div className="mt-1 text-xs text-white/70">
        by {event.clubName} · {event.participants} participants
      </div>
    </div>
  </article>
);

export function ExplorePage({ onBack }) {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [campusTrending, setCampusTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [isAllClubsModalOpen, setIsAllClubsModalOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const [randomClub, setRandomClub] = useState(null);
  const [suggestedPosts, setSuggestedPosts] = useState(null);
  const [suggestedPostsLoading, setSuggestedPostsLoading] = useState(true);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestedUsersLoading, setSuggestedUsersLoading] = useState(true);
  const [activePostId, setActivePostId] = useState(null);
  const [threadPostId, setThreadPostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const likeTimersRef = useRef({});
  const pendingLikePostIdsRef = useRef(new Set());
  useEffect(() => {
    const fetchRandomClub = async () => {
      try {
        const res = await fetch('/api/clubs');
        if (!res.ok) throw new Error('Failed to fetch clubs');
        const data = await res.json();
        const clubs = data.clubs;
        if (Array.isArray(clubs) && clubs.length > 0) {
          const random = clubs[Math.floor(Math.random() * clubs.length)];
          setRandomClub(random);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRandomClub();
  }, []);
  const router = useRouter();
  const formatted = randomClub?.memberCount
    ? randomClub.memberCount >= 1000
      ? `${(randomClub.memberCount / 1000).toFixed(1).replace(/\\.0$/, '')}k`
      : randomClub.memberCount.toLocaleString()
    : '';

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrendingCampus = async () => {
      try {
        setTrendingLoading(true);
        const res = await fetch("/api/explore/trending-campus", { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to fetch trending campus events");
        const data = await res.json();
        setCampusTrending(Array.isArray(data.events) ? data.events : []);
      } catch (err) {
        if (err.name !== "AbortError") setCampusTrending([]);
      } finally {
        if (!controller.signal.aborted) setTrendingLoading(false);
      }
    };

    fetchTrendingCampus();

    return () => controller.abort();
  }, []);

  const loadSuggestedUsers = useCallback(async (signal) => {
    try {
      setSuggestedUsersLoading(true);
      const res = await fetch("/api/explore/suggested-users", { signal });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to fetch suggested users");

      setSuggestedUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        setSuggestedUsers([]);
      }
    } finally {
      if (!signal?.aborted) setSuggestedUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSuggestedUsers(controller.signal);

    return () => controller.abort();
  }, [loadSuggestedUsers]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults((data.results || []).filter((item) => item.type === "user"));
      } catch (err) {
        if (err.name !== "AbortError") setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const showSearchResults = useMemo(() => Boolean(query.trim()) && isDropdownOpen, [query, isDropdownOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!searchContainerRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);


  useEffect(() => {
    const controller = new AbortController();

    const loadSuggestedPosts = async () => {
      try {
        setSuggestedPostsLoading(true);
        const res = await fetch("/api/posts?sort=top&limit=10", { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch suggested posts");

        const normalizedPosts = (data.posts || [])
          .map(normalizePost)
          .filter(Boolean);

        setSuggestedPosts(normalizedPosts);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          setSuggestedPosts([]);
        }
      } finally {
        if (!controller.signal.aborted) setSuggestedPostsLoading(false);
      }
    };

    loadSuggestedPosts();

    return () => controller.abort();
  }, []);

  useEffect(() => () => {
    Object.values(likeTimersRef.current).forEach((timer) => clearTimeout(timer));
  }, []);

  const selectedThreadPost = useMemo(
    () => (Array.isArray(suggestedPosts) ? suggestedPosts.find((post) => post.id === threadPostId) ?? null : null),
    [suggestedPosts, threadPostId]
  );

  const updateSingleSuggestedPost = (updatedPost) => {
    const normalizedUpdatedPost = normalizePost(updatedPost);
    if (!normalizedUpdatedPost) return;

    setSuggestedPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) => (post.id === normalizedUpdatedPost.id ? normalizedUpdatedPost : post))
        : prev
    );
  };

  const handleReportClick = (postId) => {
    setMenuPostId(null);
    setReportPostId(postId);
  };

  const handleOpenThread = (postId) => {
    if (!postId) return;

    setThreadPostId(postId);
    setMenuPostId(null);
  };

  const handleBackToSuggestedPosts = () => {
    setThreadPostId(null);
    setMenuPostId(null);
  };

  const handleCommentSubmit = async (postId, payload) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to add comment");

      updateSingleSuggestedPost(data.post);
      setActivePostId(null);
      setThreadPostId(postId);
    } catch (error) {
      console.error(error);
      alert("Could not publish comment");
    }
  };

  const queueLikeToggle = (postId, currentlyLiked) => {
    if (!postId || typeof postId !== "string") {
      console.error("Invalid post id:", postId);
      return;
    }

    if (pendingLikePostIdsRef.current.has(postId)) return;

    setSuggestedPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) => {
            if (post.id !== postId) return post;

            const nextLiked = !currentlyLiked;
            const nextLikeCount = Math.max(0, Number(post.likeCount || 0) + (nextLiked ? 1 : -1));

            return {
              ...post,
              likedByCurrentUser: nextLiked,
              likeCount: nextLikeCount,
              likePending: true,
            };
          })
        : prev
    );

    if (likeTimersRef.current[postId]) {
      clearTimeout(likeTimersRef.current[postId]);
    }

    likeTimersRef.current[postId] = setTimeout(async () => {
      pendingLikePostIdsRef.current.add(postId);

      try {
        const method = currentlyLiked ? "DELETE" : "POST";
        const res = await likePost(postId, method);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to update like");
        }

        setSuggestedPosts((prev) =>
          Array.isArray(prev)
            ? prev.map((post) =>
                post.id === postId
                  ? {
                      ...post,
                      likedByCurrentUser: Boolean(data.likedByCurrentUser),
                      likeCount: Number(data.likeCount || 0),
                      likePending: false,
                    }
                  : post
              )
            : prev
        );
      } catch (error) {
        console.error(error);
        setSuggestedPosts((prev) =>
          Array.isArray(prev)
            ? prev.map((post) => {
                if (post.id !== postId) return post;

                const rollbackLiked = currentlyLiked;
                return {
                  ...post,
                  likedByCurrentUser: rollbackLiked,
                  likeCount: Math.max(0, Number(post.likeCount || 0) + (rollbackLiked ? 1 : -1)),
                  likePending: false,
                };
              })
            : prev
        );
      } finally {
        pendingLikePostIdsRef.current.delete(postId);
        delete likeTimersRef.current[postId];
      }
    }, 220);
  };

  const renderPostCard = (post, { isThread = false } = {}) => (
    <div
      className={`userpost ${menuPostId === post.id ? "menu-open" : ""} ${isThread ? "thread-root-post" : ""}`}
      key={post.id}
      onClick={() => handleOpenThread(post.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenThread(post.id);
        }
      }}
    >
      <div className="post-left">
        <div className="profilepic">
          <ReliableImage
            className="profileimg"
            src={post.authorImage}
            alt={post.authorName || "User"}
            fallbackSrc={buildAvatarFallback(post.authorName)}
            maxRetries={3}
          />
        </div>
      </div>

      <div className="post-right">
        <div className="posth">
          <div className="posth-left">
            <div className="user-name">
              {post.authorName || "UniLynk User"}
              {post.postAs === "club" && <Icon icon="heroicons-solid:badge-check" color="#1d9bf0" width={18} />}
            </div>
            <div className="post-time"><span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="4" r="1.5" fill="grey" />
            </svg></span><div className="post-timeli">{formatRelativeTime(post.createdAt)}</div></div>
          </div>
          <div className="posth-right">
            <button
              className="posth-right-btn"
              onClick={(event) => {
                event.stopPropagation();
                setMenuPostId(menuPostId === post.id ? null : post.id);
              }}
              aria-label="Post options"
              type="button"
            >
              <EllipsisVertical />
            </button>
            {menuPostId === post.id && (
              <div className="post-dropdown-menu" onClick={(event) => event.stopPropagation()}>
                <button className="menu-item" onClick={() => handleReportClick(post.id)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Report Post
                </button>
                <button className="menu-item" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  Save Post
                </button>
                <button className="menu-item" onClick={() => {
                  setMenuPostId(null);
                  setSharePost(post);
                  setOpenShare(true);
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="post-content">
          {post.content}
          {!!post.images?.length && (
            <div className="image-post">
              <div className={getImageGridClass(post.images.length)}>
                {post.images.map((imageUrl, idx) => (
                  <img key={`${post.id}-${idx}`} src={imageUrl} alt="Post image" />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="post-foot" onClick={(event) => event.stopPropagation()}>
          <div className="post-foot-iconcont">
            <button
              onClick={() => {
                if (!post?.id) {
                  console.error("Invalid post id:", post);
                  return;
                }

                queueLikeToggle(post.id, Boolean(post.likedByCurrentUser));
              }}
              disabled={Boolean(post.likePending)}
              aria-label={post.likedByCurrentUser ? "Unlike post" : "Like post"}
              className={`like-button ${post.likedByCurrentUser ? "liked" : ""}`}
              type="button"
            >
              <img className="post-foot-icon" src="/Postimg/thumb.svg" alt="Like" />
            </button>
            <span className="post-like-count">{Number(post.likeCount || 0)}</span>
          </div>
          <div className="post-foot-iconcont">
            <button onClick={() => {
              if (!post?.id) return;
              setThreadPostId(post.id);
              setActivePostId(post.id);
            }} type="button">
              <img className="post-foot-icon" src="/Postimg/comment.svg" alt="Comment" />
            </button>
            <span className="post-comment-count">{Number(post.commentCount || 0)}</span>
          </div>
          <div className="post-foot-iconcont">
            <button onClick={() => { setSharePost(post); setOpenShare(true); }} type="button">
              <img className="post-foot-icon" src="/Postimg/share.svg" alt="Share" />
            </button>
            <span className="post-share-count">0</span>
          </div>
          <div className="post-foot-iconcont">
            <img className="post-foot-icon" src="/Postimg/bookmark.svg" alt="bookmark" />
            <span className="post-bookmark-count">0</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComment = (comment) => (
    <div className="thread-comment" key={comment.id}>
      <div className="thread-comment-avatar">
        <ReliableImage
          className="profileimg"
          src={comment.authorImage}
          alt={comment.authorName || "User"}
          fallbackSrc={buildAvatarFallback(comment.authorName)}
          maxRetries={3}
        />
      </div>
      <div className="thread-comment-body">
        <div className="thread-comment-meta">
          <span className="user-name">{comment.authorName || "UniLynk User"}</span>
          <span className="post-time">
            <span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="1.5" fill="grey" /></svg></span>
            <span className="post-timeli">{formatRelativeTime(comment.createdAt)}</span>
          </span>
        </div>
        {!!comment.content && <div className="thread-comment-content">{comment.content}</div>}
        {!!comment.images?.length && (
          <div className="thread-comment-media">
            <div className={getImageGridClass(comment.images.length)}>
              {comment.images.map((imageUrl, index) => (
                <img key={`${comment.id}-${index}`} src={imageUrl} alt="Reply media" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
        <button
          onClick={onBack}
          className="w-9 h-9 shrink-0 grid place-items-center rounded-full hover:bg-neutral-100 transition"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="relative w-[85%]" ref={searchContainerRef}>
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onFocus={() => setIsDropdownOpen(Boolean(query.trim()))}
            onChange={(e) => {
              const nextQuery = e.target.value;
              setQuery(nextQuery);
              setIsDropdownOpen(Boolean(nextQuery.trim()));
            }}
            placeholder="Search students, clubs, events…"
            className="w-full pl-11 pr-4 py-3 rounded-full bg-neutral-100 border border-transparent focus:bg-white focus:border-neutral-300 outline-none text-sm transition"
          />

          {showSearchResults && (
            <div
              className="absolute top-[calc(100%+8px)] left-0 z-30 max-h-[520px] overflow-y-auto overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
              style={{ width: 484 }}
            >
              {searchLoading ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  Searching users...
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-neutral-500">
                  No users found for "{query}"
                </div>
              ) : (
                <ul className="flex flex-col">
                  {results.map((user) => (
                    <li key={user.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-neutral-50"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          router.push(`/dashboard/search/id=${user.id}`);
                        }}
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-100 ring-2 ring-white shadow-sm">
                          {user.image ? (
                            <ImageWithFallback
                              src={user.image}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-700">
                              {initials(user.name)}
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-neutral-900">{user.name}</span>
                          <span className="truncate text-neutral-500">
                            {user.email || `@${user.username || "user"}`}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">


        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[1.125rem] font-bold">Trending on Campus</h3>
            </div>
            <button className="text-xs text-neutral-500 hover:text-black">View all</button>
          </div>

          {trendingLoading ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="row-span-2 min-h-72 rounded-2xl bg-neutral-100 animate-pulse" />
              <div className="min-h-36 rounded-2xl bg-neutral-100 animate-pulse" />
              <div className="min-h-36 rounded-2xl bg-neutral-100 animate-pulse" />
            </div>
          ) : campusTrending.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
              Past activity photos will appear here after club leaders publish them.
            </div>
          ) : campusTrending.length === 1 ? (
            <div className="grid grid-cols-1 gap-3">
              <TrendingCard event={campusTrending[0]} featured />
            </div>
          ) : campusTrending.length === 2 ? (
            <div className="grid grid-cols-2 gap-3">
              {campusTrending.map((event) => (
                <TrendingCard key={event.id} event={event} featured />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <TrendingCard event={campusTrending[0]} featured />
              {campusTrending.slice(1, 3).map((event) => (
                <TrendingCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">

              <h3 className="text-[1.125rem] font-bold">Suggested Clubs</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAllClubsModalOpen(true)}
              className="text-xs text-neutral-500 hover:text-black"
            >
              View all
            </button>
          </div>

          <div className="size-full flex items-center justify-center">
            <div className="w-full max-w-2xl">


              <div
                className="relative w-full overflow-hidden rounded-3xl border p-2 border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white cursor-pointer"
                onClick={() => {
                  if (randomClub?._id) {
                    router.push(`/Club?clubId=${randomClub._id}`);
                  }
                }}
              >
                <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-neutral-100">
                  {randomClub?.banner ? (
                    <img
                      src={randomClub.banner}
                      alt={`${randomClub.clubName || ''} cover`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                      <span className="text-4xl font-bold text-neutral-300">
                        {initials(randomClub?.clubName)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-black" />
                    <span
                      className="text-black uppercase"
                      style={{ fontSize: 10, letterSpacing: "0.08em" }}
                    >
                      {randomClub?.category || ''}
                    </span>
                  </div>

                  <button
                    aria-label="View club"
                    className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-black hover:text-white"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 17L17 7" />
                      <path d="M7 7h10v10" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 px-3 pb-3 pt-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(0,0,0,0.25)]">
                    {randomClub?.logo ? (
                      <img
                        src={randomClub.logo}
                        alt={`${randomClub.clubName} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-black leading-tight">{randomClub?.clubName || ''}</h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-neutral-500">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{formatted} members</span>
                    </div>
                  </div>

                  <button className="shrink-0 rounded-full bg-black px-4 py-2 text-white transition hover:bg-neutral-800 active:scale-95">
                    Visit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">

              <h3 className="text-[1.125rem] font-bold">Suggested for you</h3>
            </div>
            <button
              type="button"
              onClick={() => loadSuggestedUsers()}
              className="text-xs text-neutral-500 hover:text-black"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {suggestedUsersLoading ? (
              <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
                Loading suggestions...
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
                No suggested users found.
              </div>
            ) : (
              suggestedUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                    <ImageWithFallback
                      src={u.avatar}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{u.name}</div>
                    <div className="text-xs text-neutral-500 truncate">{u.role}</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{u.mutual} mutual</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/Userprofile?userId=${u.id}`)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white text-xs hover:bg-neutral-800 transition"
                  >
                    <UserPlus size={12} />
                    View
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[1.125rem] font-bold">Suggested posts</h3>
            </div>

            <div className={`userposts ${selectedThreadPost ? "thread-userposts" : ""} !m-0 !w-full !p-0`}>
              {(suggestedPostsLoading || !suggestedPosts) && <Loading />}

              {!suggestedPostsLoading && Array.isArray(suggestedPosts) && suggestedPosts.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
                  No suggested posts yet. The most-liked campus posts will appear here.
                </div>
              )}

              {!suggestedPostsLoading && selectedThreadPost && (
                <section className="thread-view" aria-label="Post thread view">
                  <div className="thread-view-header">
                    <button
                      type="button"
                      className="thread-back-button"
                      onClick={handleBackToSuggestedPosts}
                    >
                      <ArrowLeft size={18} />
                      <span>Back to suggested posts</span>
                    </button>
                    <div>
                      <h2 className="thread-view-title">Post</h2>
                    </div>
                  </div>

                  {renderPostCard(selectedThreadPost, { isThread: true })}

                  <div className="thread-replies-panel">
                    <div className="thread-replies-header-row">
                      <div>
                        <h3 className="thread-replies-title">Replies</h3>
                        <p className="thread-replies-subtitle">Join the conversation under this post.</p>
                      </div>
                      <button
                        type="button"
                        className="thread-reply-button"
                        onClick={() => setActivePostId(selectedThreadPost.id)}
                      >
                        Reply
                      </button>
                    </div>

                    {!!selectedThreadPost.comments?.length ? (
                      <div className="thread-comments-list">
                        {selectedThreadPost.comments.map(renderComment)}
                      </div>
                    ) : (
                      <div className="thread-empty-state">
                        <div className="nocomment-illuistration"><img src="/dashboard/nocomment.svg" alt="" /></div>
                        <h4>No replies yet</h4>
                        <p>Be the first person to reply to this post.</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {!suggestedPostsLoading && Array.isArray(suggestedPosts) && !selectedThreadPost && suggestedPosts.map((post) => renderPostCard(post))}
            </div>
          </div>
        </section>
        
      </div>

      <CommentModal
        isOpen={Boolean(activePostId)}
        onClose={() => setActivePostId(null)}
        onSubmit={(payload) => {
          if (!activePostId) return;
          handleCommentSubmit(activePostId, payload);
        }}
        currentUser={session?.user}
      />

      <ShareModal
        isOpen={openShare}
        post={sharePost}
        onClose={() => {
          setOpenShare(false);
          setSharePost(null);
        }}
      />

      <ReportPostModal
        isOpen={Boolean(reportPostId)}
        postId={reportPostId}
        onClose={() => setReportPostId(null)}
      />

      <AllClubsModal
        open={isAllClubsModalOpen}
        onClose={() => setIsAllClubsModalOpen(false)}
      />
    </div>
  );
}
