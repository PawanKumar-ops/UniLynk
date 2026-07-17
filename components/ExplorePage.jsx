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
import { DeleteModal } from "./DeleteModal";
import { AllClubsModal } from "./AllClubsModal";
import { PostCard } from "./PostCard";

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


const ImageLightbox = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isVisible, setIsVisible] = useState(false);
  const touchStartRef = useRef(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 220);
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft" && images.length > 1) {
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        setCurrentIndex((i) => (i + 1) % images.length);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length]);

  const goTo = (idx) => setCurrentIndex((idx + images.length) % images.length);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? currentIndex + 1 : currentIndex - 1);
    touchStartRef.current = null;
  };

  return (
    <div
      className={`lightbox-overlay ${isVisible ? "lightbox-visible" : ""}`}
      onClick={handleClose}
    >
      <button className="lightbox-close" onClick={handleClose} type="button" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {images.length > 1 && <div className="lightbox-counter">{currentIndex + 1} / {images.length}</div>}

      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img key={currentIndex} className="lightbox-img" src={images[currentIndex]} alt="" draggable={false} />
      </div>

      {images.length > 1 && (
        <>
          <button
            className="lightbox-nav lightbox-nav-left"
            onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
            type="button"
            aria-label="Previous image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="lightbox-nav lightbox-nav-right"
            onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
            type="button"
            aria-label="Next image"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {images.length > 1 && (
        <div className="lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={i}
              className={`lightbox-thumb-btn ${i === currentIndex ? "lightbox-thumb-active" : ""}`}
              onClick={() => setCurrentIndex(i)}
              type="button"
              aria-label={`View image ${i + 1}`}
            >
              <img src={img} alt="" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const PollCard = ({ postId, poll, onPollChange }) => {
  const [votedOptionId, setVotedOptionId] = useState(poll.votedOptionId ?? null);
  const [options, setOptions] = useState(Array.isArray(poll.options) ? poll.options : []);
  const [totalVotes, setTotalVotes] = useState(Number(poll.totalVotes || 0));
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [hasEnded, setHasEnded] = useState(new Date(poll.endsAt).getTime() <= Date.now());

  useEffect(() => {
    setVotedOptionId(poll.votedOptionId ?? null);
    setOptions(Array.isArray(poll.options) ? poll.options : []);
    setTotalVotes(Number(poll.totalVotes || 0));
    setHasEnded(new Date(poll.endsAt).getTime() <= Date.now());
  }, [poll]);

  useEffect(() => {
    const endsAtMs = new Date(poll.endsAt).getTime();
    const delay = endsAtMs - Date.now();

    if (!Number.isFinite(endsAtMs) || delay <= 0) {
      setHasEnded(true);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setHasEnded(true), Math.min(delay, 2147483647));
    return () => window.clearTimeout(timeoutId);
  }, [poll.endsAt]);

  const hasVoted = votedOptionId !== null;
  const showResults = hasVoted || hasEnded;
  const maxVotes = Math.max(...options.map((o) => Number(o.votes || 0)), 0);

  const formatTimeLeft = (endsAt) => {
    const diff = new Date(endsAt).getTime() - Date.now();
    if (diff <= 0) return "Final results";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.ceil((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days !== 1 ? "s" : ""} left`;
    return `${Math.max(hours, 1)}h left`;
  };

  const applyPollSnapshot = (nextPoll) => {
    if (!nextPoll) return;
    setVotedOptionId(nextPoll.votedOptionId ?? null);
    setOptions(Array.isArray(nextPoll.options) ? nextPoll.options : []);
    setTotalVotes(Number(nextPoll.totalVotes || 0));
    setHasEnded(new Date(nextPoll.endsAt).getTime() <= Date.now());
    onPollChange?.(nextPoll);
  };

  const handleVote = async (optionId) => {
    if (hasVoted || hasEnded || isSavingVote || !postId) return;

    const previousState = { votedOptionId, options, totalVotes };
    const optimisticOptions = options.map((option) =>
      option.id === optionId ? { ...option, votes: Number(option.votes || 0) + 1 } : option,
    );
    const optimisticTotalVotes = totalVotes + 1;

    setVotedOptionId(optionId);
    setOptions(optimisticOptions);
    setTotalVotes(optimisticTotalVotes);
    onPollChange?.({
      ...poll,
      options: optimisticOptions,
      totalVotes: optimisticTotalVotes,
      votedOptionId: optionId,
    });

    setIsSavingVote(true);
    try {
      const response = await fetch(`/api/posts/${postId}/poll-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data?.poll) {
          applyPollSnapshot(data.poll);
          return;
        }
        throw new Error(data?.error || "Could not save poll vote");
      }

      applyPollSnapshot(data.poll);
    } catch (error) {
      console.error(error);
      setVotedOptionId(previousState.votedOptionId);
      setOptions(previousState.options);
      setTotalVotes(previousState.totalVotes);
      onPollChange?.({
        ...poll,
        options: previousState.options,
        totalVotes: previousState.totalVotes,
        votedOptionId: previousState.votedOptionId,
      });
    } finally {
      setIsSavingVote(false);
    }
  };

  return (
    <div className="poll-card" onClick={(e) => e.stopPropagation()}>
      {options.map((option) => {
        const optionVotes = Number(option.votes || 0);
        const pct = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        const isWinner = showResults && optionVotes === maxVotes && maxVotes > 0;
        const isMyVote = votedOptionId === option.id;

        return (
          <button
            key={option.id}
            className="poll-option"
            onClick={() => handleVote(option.id)}
            disabled={showResults || isSavingVote}
            type="button"
          >
            {showResults && (
              <div
                className={`poll-option-fill ${isWinner ? "poll-fill-winner" : ""} ${isMyVote ? "poll-fill-myvote" : ""}`}
                style={{ width: `${pct}%` }}
              />
            )}
            <div className="poll-option-content">
              <span className="poll-option-label">
                {option.text}
                {isMyVote && showResults && (
                  <svg className="poll-check-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
              {showResults && <span className="poll-option-pct">{pct}%</span>}
            </div>
          </button>
        );
      })}
      <div className="poll-meta">
        <span>{totalVotes.toLocaleString()} votes</span>
        <span className="poll-meta-dot">·</span>
        <span>{formatTimeLeft(poll.endsAt)}</span>
      </div>
    </div>
  );
};

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

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

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
    bookmarkCount: Number(post.bookmarkCount || 0),
  };
};

const likePost = async (postId, method) => {
  if (!postId || typeof postId !== "string" || !postId.trim()) {
    throw new Error("Attempted like without postId");
  }

  return fetch(`/api/posts/${postId}/like`, { method });
};

const getImageGridClass = (count) => {
  if (count === 1) return "x-single-image";
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
  const postRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const hasRestoredInitialScrollRef = useRef(false);
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
  const [lightbox, setLightbox] = useState({ images: [], index: 0, open: false });
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const likeTimersRef = useRef({});
  const pendingLikePostIdsRef = useRef(new Set());
  const pendingSavePostIdsRef = useRef(new Set());
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
      const res = await fetch("/api/explore/suggested-users", {
        cache: "no-store",
        signal,
      });
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

  const openLightbox = (images, index) => {
    setLightbox({ images, index, open: true });
  };

  const updateSingleSuggestedPost = (updatedPost) => {
    const normalizedUpdatedPost = normalizePost(updatedPost);
    if (!normalizedUpdatedPost) return;

    setSuggestedPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) => (post.id === normalizedUpdatedPost.id ? normalizedUpdatedPost : post))
        : prev
    );
  };

  const isPostAuthor = (post) => {
    const sessionEmail = normalizeEmail(session?.user?.email);
    const authorEmail = normalizeEmail(post?.authorEmail);

    return Boolean(sessionEmail && authorEmail && sessionEmail === authorEmail);
  };

  const handleDeleteClick = (post) => {
    if (!isPostAuthor(post)) return;

    setMenuPostId(null);
    setDeletePost(post);
  };

  const handleDeletePost = async () => {
    if (!deletePost?.id || isDeletingPost) return;

    try {
      setIsDeletingPost(true);
      const res = await fetch(`/api/posts/${deletePost.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete post");
      }

      setSuggestedPosts((prev) =>
        Array.isArray(prev) ? prev.filter((post) => post.id !== deletePost.id) : prev
      );
      if (threadPostId === deletePost.id) setThreadPostId(null);
      if (activePostId === deletePost.id) setActivePostId(null);
      if (sharePost?.id === deletePost.id) {
        setSharePost(null);
        setOpenShare(false);
      }
      setDeletePost(null);
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleReportClick = (postId) => {
    setMenuPostId(null);
    setReportPostId(postId);
  };

  const handleOpenThread = (postId) => {
    if (!postId) return;

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      window.sessionStorage.setItem("explore-feed-scroll-position", String(scrollContainer.scrollTop));
    }
    window.sessionStorage.setItem("explore-feed-open-post-id", postId);
    window.sessionStorage.setItem("explore-post-opened-from-feed", "true");

    setMenuPostId(null);
    router.push(`/dashboard/post/${postId}`);
  };

  const isElementVisibleWithinContainer = (element, container) => {
    if (!(element instanceof HTMLElement) || !(container instanceof HTMLElement))
      return false;

    const elementTop = element.offsetTop;
    const elementBottom = elementTop + element.offsetHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    return elementTop >= containerTop && elementBottom <= containerBottom;
  };

  useEffect(() => {
    if (suggestedPostsLoading || !suggestedPosts || !scrollContainerRef.current) return;

    if (hasRestoredInitialScrollRef.current) return;

    const savedScroll = window.sessionStorage.getItem("explore-feed-scroll-position");
    const savedPostId = window.sessionStorage.getItem("explore-feed-open-post-id");
    const openedFromExplore = window.sessionStorage.getItem("explore-post-opened-from-feed") === "true";

    // Consume keys so refresh won't restore
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("explore-feed-scroll-position");
      window.sessionStorage.removeItem("explore-feed-open-post-id");
      window.sessionStorage.removeItem("explore-post-opened-from-feed");
    }

    if (openedFromExplore) {
      const scrollContainer = scrollContainerRef.current;
      const restoreScrollTop = savedScroll ? Number(savedScroll) : 0;
      scrollContainer.scrollTop = restoreScrollTop;

      if (savedPostId) {
        const restorePostElement = postRefs.current[savedPostId];
        if (restorePostElement) {
          if (!isElementVisibleWithinContainer(restorePostElement, scrollContainer)) {
            restorePostElement.scrollIntoView({ block: "center" });
          }
        }
      }
    }

    hasRestoredInitialScrollRef.current = true;
  }, [suggestedPostsLoading, suggestedPosts]);

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
      router.push(`/dashboard/post/${postId}`);
    } catch (error) {
      console.error(error);
      alert("Could not publish comment");
    }
  };

  const handlePollChange = (postId, nextPoll) => {
    if (!postId || !nextPoll) return;

    setSuggestedPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) => (post.id === postId ? { ...post, poll: nextPoll } : post))
        : prev
    );
  };

  const toggleSavePost = async (postId) => {
    if (!postId || pendingSavePostIdsRef.current.has(postId)) return;

    const currentPost = Array.isArray(suggestedPosts)
      ? suggestedPosts.find((post) => post.id === postId)
      : null;
    const wasSaved = Boolean(currentPost?.savedByCurrentUser);
    const previousBookmarkCount = Number(currentPost?.bookmarkCount || 0);
    const optimisticSaved = !wasSaved;
    const optimisticBookmarkCount = Math.max(
      0,
      previousBookmarkCount + (optimisticSaved ? 1 : -1),
    );

    pendingSavePostIdsRef.current.add(postId);
    setSuggestedPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) =>
          post.id === postId
            ? {
              ...post,
              savedByCurrentUser: optimisticSaved,
              bookmarkCount: optimisticBookmarkCount,
            }
            : post
        )
        : prev
    );

    try {
      const res = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed");
      }

      setSuggestedPosts((prev) =>
        Array.isArray(prev)
          ? prev.map((post) =>
            post.id === postId
              ? {
                ...post,
                savedByCurrentUser: Boolean(data.saved),
                bookmarkCount: Number(data.bookmarkCount ?? optimisticBookmarkCount),
              }
              : post
          )
          : prev
      );
    } catch (err) {
      console.error(err);
      setSuggestedPosts((prev) =>
        Array.isArray(prev)
          ? prev.map((post) =>
            post.id === postId
              ? {
                ...post,
                savedByCurrentUser: wasSaved,
                bookmarkCount: previousBookmarkCount,
              }
              : post
          )
          : prev
      );
    } finally {
      pendingSavePostIdsRef.current.delete(postId);
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

  const legacyRenderPostCard = (post, { isThread = false } = {}) => (
    <div
      className={`userpost ${menuPostId === post.id ? "menu-open" : ""} ${isThread ? "thread-root-post" : ""}`}
      key={post.id}
      ref={
        isThread
          ? undefined
          : (node) => {
            if (node) {
              postRefs.current[post.id] = node;
            } else {
              delete postRefs.current[post.id];
            }
          }
      }
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
            <div className="dd-post-time"><span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
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
                {isPostAuthor(post) && (
                  <button
                    className="menu-item menu-item-danger"
                    type="button"
                    onClick={() => handleDeleteClick(post)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete post
                  </button>
                )}
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    toggleSavePost(post.id);
                    setMenuPostId(null);
                  }}
                >
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
              {post.images.length === 1 ? (
                <div className="x-single-image">
                  <img
                    src={post.images[0]}
                    alt=""
                    loading="lazy"
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(post.images, 0);
                    }}
                  />
                </div>
              ) : (
                <div className={getImageGridClass(post.images.length)}>
                  {post.images.map((imageUrl, idx) => (
                    <img
                      key={`${post.id}-${idx}`}
                      src={imageUrl}
                      alt=""
                      loading="lazy"
                      onClick={(e) => { e.stopPropagation(); openLightbox(post.images, idx); }}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {post.poll && (
            <PollCard
              postId={post.id}
              poll={post.poll}
              onPollChange={(nextPoll) => handlePollChange(post.id, nextPoll)}
            />
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
              router.push(`/dashboard/post/${post.id}`);
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
            <button type="button" onClick={() => toggleSavePost(post.id)}>
              <img
                className="post-foot-icon"
                src="/Postimg/bookmark.svg"
                alt="bookmark"
                style={{ opacity: post.savedByCurrentUser ? 1 : 0.6 }}
              />
            </button>
            <span className="post-bookmark-count">{Number(post.bookmarkCount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Keep feed state and API mutations here; the shared card owns the presentation.
  const sharedPostCard = (post, { isThread = false } = {}) => (
    <PostCard
      key={post.id}
      post={post}
      isThread={isThread}
      menuOpen={menuPostId === post.id}
      postRef={isThread ? undefined : (node) => { if (node) postRefs.current[post.id] = node; else delete postRefs.current[post.id]; }}
      formatTime={formatRelativeTime}
      imageGridClass={getImageGridClass}
      avatarFallback={buildAvatarFallback}
      onOpenPost={(id) => handleOpenThread(id)}
      onToggleMenu={() => setMenuPostId(menuPostId === post.id ? null : post.id)}
      onReport={handleReportClick}
      onDelete={handleDeleteClick}
      canDelete={isPostAuthor(post)}
      onLike={(id) => queueLikeToggle(id, Boolean(post.likedByCurrentUser))}
      onComment={(id) => router.push(`/dashboard/post/${id}`)}
      onShare={(nextPost) => { setSharePost(nextPost); setOpenShare(true); }}
      onSave={toggleSavePost}
      pollContent={post.poll && <PollCard postId={post.id} poll={post.poll} onPollChange={(nextPoll) => handlePollChange(post.id, nextPoll)} />}
    />
  );
  const renderPostCard = sharedPostCard;

  const handleOpenCommentAuthorProfile = async (event, comment) => {
    event.stopPropagation();

    let authorId =
      typeof comment?.authorId === "string"
        ? comment.authorId.trim()
        : typeof comment?.author?.id === "string"
          ? comment.author.id.trim()
          : "";

    // If no authorId, try to fetch by email (for old comments)
    if (!authorId && typeof comment?.authorEmail === "string" && comment.authorEmail.trim()) {
      try {
        const res = await fetch(`/api/user/lookup?email=${encodeURIComponent(comment.authorEmail)}`);
        if (res.ok) {
          const data = await res.json();
          authorId = data.userId || "";
        }
      } catch (err) {
        console.error("Failed to lookup user by email:", err);
      }
    }

    if (!authorId) return;
    router.push(`/dashboard/Userprofile?userId=${authorId}`);
  };

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
          <button
            className="post-author-link"
            type="button"
            disabled={!comment.authorId && !comment.authorEmail}
            onClick={(event) => handleOpenCommentAuthorProfile(event, comment)}
          >
            <span className="user-name">{comment.authorName || "UniLynk User"}</span>
          </button>
          <span className="dd-post-time">
            <span className="post-dot"><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="1.5" fill="grey" /></svg></span>
            <span className="post-timeli">{formatRelativeTime(comment.createdAt)}</span>
          </span>
        </div>
        {!!comment.content && <div className="thread-comment-content">{comment.content}</div>}
        {!!comment.images?.length && (
          <div className="thread-comment-media">
            <div className={getImageGridClass(comment.images.length)}>
              {comment.images.map((imageUrl, index) => (
                <img
                  key={`${comment.id}-${index}`}
                  src={imageUrl}
                  alt="Reply media"
                  onClick={(e) => { e.stopPropagation(); openLightbox(comment.images, index); }}
                  style={{ cursor: "pointer" }}
                />
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

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar-thumb]:hidden [&::-webkit-scrollbar-track]:hidden px-[14px] py-5 space-y-8">


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
                    router.push(`/dashboard/Club?clubId=${randomClub._id}`);
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
                    <span
                      className="text-black uppercase"
                      style={{ fontSize: 10, letterSpacing: "0.08em" }}
                    >
                      {randomClub?.category || ''}
                    </span>
                  </div>
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
                    <div className="mt-0.5 flex items-center gap-1 text-neutral-500">
                      <Icon icon="solar:user-linear" className="w-4 h-4"/>
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
              <>
                {Array.from({ length: 4 }).map((_, index) => (
                  <SuggestedUserSkeleton key={index} />
                ))}
              </>
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

      <DeleteModal
        open={Boolean(deletePost)}
        onOpenChange={(open) => {
          if (!open && !isDeletingPost) setDeletePost(null);
        }}
        onDelete={handleDeletePost}
        isDeleting={isDeletingPost}
      />

      <AllClubsModal
        open={isAllClubsModalOpen}
        onClose={() => setIsAllClubsModalOpen(false)}
      />

      {lightbox.open && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox((prev) => ({ ...prev, open: false }))}
        />
      )}
    </div>
  );
}
