"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import "./dashboard.css";
import { ArrowLeft, EllipsisVertical, ArrowRight, X as XIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import PostFab from "../../components/Post-Fab";
import ReliableImage from "../../components/ReliableImage";
import CommentModal from "@/components/CommentModal";
import ShareModal from "@/components/ShareModal";
import { ReportPostModal } from "@/components/ReportPostModal";
import { DeleteModal } from "@/components/DeleteModal";
import PastEventNotifiModal from "@/components/PastEventNotifiModal";
import RequestModal from "@/components/TeamRequest";
import { ExplorePage } from "@/components/ExplorePage";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen } from "lucide-react";
import { Icon } from "@iconify/react";
import ImageWithFallback from "../../components/ReliableImage";
import { NewsLetterCard } from "@/components/NewsLetterCard";
import { DashboardNotificationItem } from "@/components/DashboardNotificationItem";
import { PostCard } from "@/components/PostCard";

const DASHBOARD_SCROLL_STORAGE_KEY = "dashboard-feed-scroll-position";
const DASHBOARD_OPEN_POST_STORAGE_KEY = "dashboard-feed-open-post-id";
const DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY = "dashboard-post-opened-from-feed";

const DASHBOARD_POSTS_QUERY_ROOT = ["dashboard", "posts"];
const DASHBOARD_FEED_STALE_TIME = 30 * 60 * 1000;
const DASHBOARD_POST_STALE_TIME = 30 * 60 * 1000;
const DASHBOARD_POSTS_GC_TIME = 30 * 60 * 1000;
const DASHBOARD_FEED_PAGE_SIZE = 15;

const dashboardFeedQueryKey = (audience) => [
  ...DASHBOARD_POSTS_QUERY_ROOT,
  "feed",
  audience,
];
const dashboardPostQueryKey = (postId) => [
  ...DASHBOARD_POSTS_QUERY_ROOT,
  "detail",
  postId,
];


// ─── Image Lightbox ───────────────────────────────────────────────────────────

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
      if (e.key === "ArrowLeft" && images.length > 1)
        setCurrentIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight" && images.length > 1)
        setCurrentIndex((i) => (i + 1) % images.length);
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

      {images.length > 1 && (
        <div className="lightbox-counter">{currentIndex + 1} / {images.length}</div>
      )}

      <div
        className="lightbox-content"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={currentIndex}
          className="lightbox-img"
          src={images[currentIndex]}
          alt=""
          draggable={false}
        />
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


// ─── Poll Card ────────────────────────────────────────────────────────────────

const PollCard = ({ postId, poll, onPollChange }) => {
  const [votedOptionId, setVotedOptionId] = useState(poll.votedOptionId ?? null);
  const [options, setOptions] = useState(Array.isArray(poll.options) ? poll.options : []);
  const [totalVotes, setTotalVotes] = useState(Number(poll.totalVotes || 0));
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [hasEnded, setHasEnded] = useState(
    new Date(poll.endsAt).getTime() <= Date.now(),
  );

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

    const timeoutId = window.setTimeout(
      () => setHasEnded(true),
      Math.min(delay, 2147483647),
    );

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
      option.id === optionId
        ? { ...option, votes: Number(option.votes || 0) + 1 }
        : option,
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
                  <svg
                    className="poll-check-icon"
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

const formatAuthorHandle = (email) => {
  if (typeof email !== "string") return "";
  const localPart = email.trim().split("@")[0]?.trim();
  return localPart ? `@${localPart}` : "";
};

const buildAvatarFallback = (name) => {
  const safeName = (name || "UniLynk User").trim() || "UniLynk User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=random&color=fff&size=128&bold=true`;
};

const normalizeComment = (comment, index = 0) => {
  if (!comment || typeof comment !== "object") return null;

  const candidateId = comment.id ?? comment._id ?? `comment-${index}`;
  const safeId =
    typeof candidateId === "string"
      ? candidateId.trim()
      : String(candidateId || "").trim();

  return {
    ...comment,
    id: safeId || `comment-${index}`,
    images: Array.isArray(comment.images)
      ? comment.images.filter(
        (image) => typeof image === "string" && image.trim(),
      )
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

const fetchDashboardFeedPosts = async ({ audience, cursor, signal }) => {
  const params = new URLSearchParams({
    audience,
    limit: String(DASHBOARD_FEED_PAGE_SIZE),
  });

  if (cursor) params.set("cursor", cursor);

  const res = await fetch(`/api/posts?${params.toString()}`, { signal });
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");

  return {
    posts: (data.posts || []).map(normalizePost).filter(Boolean),
    nextCursor: data.nextCursor || null,
    hasMore: Boolean(data.hasMore),
  };
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const fetchDashboardPostById = async (postId) => {
  const res = await fetch(`/api/posts/${postId}`);
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error || "Failed to fetch post");

  return normalizePost(data.post);
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

export default function DashboardClient({ postId: routePostId = null } = {}) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [isAnnual, setIsAnnual] = useState(pathname !== "/dashboard/clubs");
  const [activePostId, setActivePostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [deletePost, setDeletePost] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [dashboardView, setDashboardView] = useState(
    pathname === "/dashboard/explore" ? "explore" : "feed",
  );
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("newsletter");
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [activePastEvent, setActivePastEvent] = useState(null);
  const [activeTeamRequest, setActiveTeamRequest] = useState(null);
  const [imageRatios, setImageRatios] = useState({});
  const [lightbox, setLightbox] = useState({ images: [], index: 0, open: false });
  const [closingMenuId, setClosingMenuId] = useState(null);
  const [mobileMsgOpen, setMobileMsgOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);

  // Broadcast scroll-direction so the mobile BottomTabBar can hide/show in sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("dashboard-feed-scroll", { detail: { hidden: headerHidden } })
    );
  }, [headerHidden]);

  const openLightbox = (images, index) => {
    setLightbox({ images, index, open: true });
  };


  const closeMenu = () => {
    if (!menuPostId) return;

    setClosingMenuId(menuPostId);

    window.menuCloseTimeout = setTimeout(() => {
      setMenuPostId(null);
      setClosingMenuId(null);
    }, 200);
  };

  useEffect(() => {
    const handleClick = () => {
      closeMenu();
    };

    document.addEventListener("click", handleClick);

    return () => document.removeEventListener("click", handleClick);
  }, [menuPostId]);

  useEffect(() => {
    if (!session?.user?.email) return undefined;

    let isMounted = true;
    const refreshIntervalMs = 60 * 1000;

    const fetchJsonList = async (url) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`${url} returned ${response.status}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    };

    const notificationTimestamp = (notification) => {
      const candidate =
        notification.notificationType === "past-event"
          ? notification.eventDateTime || notification.date
          : notification.createdAt;
      const timestamp = new Date(candidate || 0).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    const fetchPendingNotifications = async () => {
      const [pastResult, teamFinderResult] = await Promise.allSettled([
        fetchJsonList("/api/clubs/past-pending"),
        fetchJsonList("/api/notifications"),
      ]);

      if (!isMounted) return;

      const pastNotifications =
        pastResult.status === "fulfilled"
          ? pastResult.value.map((notif) => ({
            ...notif,
            notificationType: "past-event",
          }))
          : [];

      const teamFinderNotifications =
        teamFinderResult.status === "fulfilled"
          ? teamFinderResult.value.map((notif) => ({
            ...notif,
            notificationType: notif.type || "team-finder-request",
          }))
          : [];

      if (pastResult.status === "rejected") {
        console.error(
          "Failed to fetch past activity notifications:",
          pastResult.reason,
        );
      }

      if (teamFinderResult.status === "rejected") {
        console.error(
          "Failed to fetch Team Finder notifications:",
          teamFinderResult.reason,
        );
      }

      setPendingNotifications(
        [...teamFinderNotifications, ...pastNotifications].sort(
          (a, b) => notificationTimestamp(b) - notificationTimestamp(a),
        ),
      );
    };

    fetchPendingNotifications();
    const intervalId = window.setInterval(
      fetchPendingNotifications,
      refreshIntervalMs,
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [session?.user?.email]);

  const handleTeamRequestDecision = async (action) => {
    if (!activeTeamRequest?._id) return;

    try {
      const response = await fetch(`/api/team-finder/requests/${activeTeamRequest._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not update team request");
      }

      setPendingNotifications((prev) =>
        prev.filter(
          (notification) =>
            notification.notificationType !== "team-finder-request" ||
            notification._id !== activeTeamRequest._id,
        ),
      );
      setActiveTeamRequest(null);
    } catch (error) {
      console.error("Failed to update team request", error);
      alert(error.message || "Could not update team request");
    }
  };

  useEffect(() => {
    setDashboardView(pathname === "/dashboard/explore" ? "explore" : "feed");
    setIsAnnual(pathname !== "/dashboard/clubs");
  }, [pathname]);

  const likeTimersRef = useRef({});
  const pendingLikePostIdsRef = useRef(new Set());
  const pendingSavePostIdsRef = useRef(new Set());
  const feedRef = useRef(null);
  const feedLoadMoreRef = useRef(null);
  const postRefs = useRef({});
  const lastScrollTopRef = useRef(0);
  const restoreFeedScrollRef = useRef(0);
  const pendingRestorePostIdRef = useRef(null);
  const hasRestoredInitialFeedScrollRef = useRef(false);

  const selectedAudience = useMemo(
    () => (isAnnual ? "for-you" : "clubs"),
    [isAnnual],
  );
  const isThreadRoute = Boolean(routePostId);

  const getCachedPost = (postId) => {
    if (!postId) return undefined;

    const cachedPost = queryClient.getQueryData(dashboardPostQueryKey(postId));
    if (cachedPost) return cachedPost;

    const feedQueries = queryClient.getQueriesData({
      queryKey: [...DASHBOARD_POSTS_QUERY_ROOT, "feed"],
    });

    for (const [, cachedData] of feedQueries) {
      const cachedPosts = Array.isArray(cachedData)
        ? cachedData
        : cachedData?.pages?.flatMap((page) => page?.posts || []) || [];
      const matchingPost = cachedPosts.find((post) => post.id === postId);
      if (matchingPost) return matchingPost;
    }

    return undefined;
  };

  const feedQuery = useInfiniteQuery({
    queryKey: dashboardFeedQueryKey(selectedAudience),
    queryFn: ({ pageParam = null, signal }) =>
      fetchDashboardFeedPosts({
        audience: selectedAudience,
        cursor: pageParam,
        signal,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? lastPage.nextCursor || undefined : undefined,
    enabled: !isThreadRoute && dashboardView === "feed",
    staleTime: DASHBOARD_FEED_STALE_TIME,
    gcTime: DASHBOARD_POSTS_GC_TIME,
    refetchOnMount: false,
  });

  const postQuery = useQuery({
    queryKey: dashboardPostQueryKey(routePostId),
    queryFn: () => fetchDashboardPostById(routePostId),
    enabled: isThreadRoute && dashboardView === "feed",
    staleTime: DASHBOARD_POST_STALE_TIME,
    gcTime: DASHBOARD_POSTS_GC_TIME,
    initialData: () => getCachedPost(routePostId),
  });

  const selectedThreadPost = isThreadRoute ? postQuery.data ?? null : null;
  const flattenedFeedPosts = useMemo(() => {
    if (!feedQuery.data?.pages) return null;

    const seenPostIds = new Set();
    const uniquePosts = [];

    for (const page of feedQuery.data.pages) {
      for (const post of page?.posts || []) {
        if (!post?.id || seenPostIds.has(post.id)) continue;
        seenPostIds.add(post.id);
        uniquePosts.push(post);
      }
    }

    return uniquePosts;
  }, [feedQuery.data]);
  const posts = useMemo(() => {
    if (!isThreadRoute) return flattenedFeedPosts;
    if (selectedThreadPost) return [selectedThreadPost];
    return postQuery.isPending ? null : [];
  }, [flattenedFeedPosts, isThreadRoute, postQuery.isPending, selectedThreadPost]);
  const loadingPosts = isThreadRoute ? postQuery.isPending : feedQuery.isPending;
  const {
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = feedQuery;

  useEffect(
    () => () => {
      Object.values(likeTimersRef.current).forEach((timer) =>
        clearTimeout(timer),
      );
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedFeedScroll = Number(
      window.sessionStorage.getItem(DASHBOARD_SCROLL_STORAGE_KEY) || 0,
    );
    const savedOpenPostId = window.sessionStorage.getItem(
      DASHBOARD_OPEN_POST_STORAGE_KEY,
    );

    restoreFeedScrollRef.current = Number.isFinite(savedFeedScroll)
      ? savedFeedScroll
      : 0;
    pendingRestorePostIdRef.current = savedOpenPostId || null;
  }, []);

  useEffect(() => {
    setActivePostId(null);
    setMenuPostId(null);
  }, [routePostId, selectedAudience]);

  useEffect(() => {
    // Cleanup of DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY is now handled after scroll restoration.
  }, [isThreadRoute]);

  useEffect(() => {
    if (feedQuery.error) console.error(feedQuery.error);
  }, [feedQuery.error]);

  useEffect(() => {
    if (postQuery.error) console.error(postQuery.error);
  }, [postQuery.error]);

  const persistFeedScroll = (scrollTop) => {
    if (typeof window === "undefined") return;

    const safeScrollTop = Number.isFinite(scrollTop)
      ? Math.max(0, scrollTop)
      : 0;
    restoreFeedScrollRef.current = safeScrollTop;
    window.sessionStorage.setItem(
      DASHBOARD_SCROLL_STORAGE_KEY,
      String(safeScrollTop),
    );
  };

  useEffect(() => {
    if (loadingPosts || selectedThreadPost || !feedRef.current) return;

    const feedElement = feedRef.current;
    const shouldRestoreInitialScroll = !hasRestoredInitialFeedScrollRef.current;
    const shouldRestoreClickedPost = Boolean(pendingRestorePostIdRef.current);

    if (!shouldRestoreInitialScroll && !shouldRestoreClickedPost) return;

    const openedFromFeed =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY) === "true";

    if (!openedFromFeed) {
      hasRestoredInitialFeedScrollRef.current = true;
      pendingRestorePostIdRef.current = null;
      return;
    }

    const restorePostId = pendingRestorePostIdRef.current;

    const restoreFeedPosition = () => {
      const savedScrollTop = Number.isFinite(restoreFeedScrollRef.current)
        ? restoreFeedScrollRef.current
        : 0;
      feedElement.scrollTop = savedScrollTop;

      if (restorePostId) {
        const restorePostElement = postRefs.current[restorePostId];
        if (
          restorePostElement &&
          !isElementVisibleWithinContainer(restorePostElement, feedElement)
        ) {
          restorePostElement.scrollIntoView({ block: "center" });
        }
      }

      hasRestoredInitialFeedScrollRef.current = true;
      pendingRestorePostIdRef.current = null;

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(DASHBOARD_SCROLL_STORAGE_KEY);
        window.sessionStorage.removeItem(DASHBOARD_OPEN_POST_STORAGE_KEY);
        window.sessionStorage.removeItem(DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY);
      }
    };

    const frameId = window.requestAnimationFrame(restoreFeedPosition);

    return () => window.cancelAnimationFrame(frameId);
  }, [loadingPosts, posts, selectedThreadPost]);


  useEffect(() => {
    if (isThreadRoute || dashboardView !== "feed") return undefined;

    const feedElement = feedRef.current;
    const loadMoreElement = feedLoadMoreRef.current;
    if (!feedElement || !loadMoreElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage &&
          !isFetching
        ) {
          fetchNextPage();
        }
      },
      {
        root: feedElement,
        rootMargin: "600px 0px",
        threshold: 0,
      },
    );

    observer.observe(loadMoreElement);

    return () => observer.disconnect();
  }, [
    dashboardView,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isThreadRoute,
  ]);

  const rememberOpenPost = (postId) => {
    if (typeof window === "undefined" || !postId) return;

    window.sessionStorage.setItem(DASHBOARD_OPEN_POST_STORAGE_KEY, postId);
    pendingRestorePostIdRef.current = postId;
  };

  const handleFeedScroll = () => {
    if (!feedRef.current) return;
    const scrollTop = feedRef.current.scrollTop;

    // Scroll-hide header on mobile: hide when scrolling down, show when scrolling up
    if (scrollTop > lastScrollTopRef.current && scrollTop > 60) {
      setHeaderHidden(true);
    } else if (scrollTop < lastScrollTopRef.current) {
      setHeaderHidden(false);
    }
    lastScrollTopRef.current = scrollTop;


    // Scroll saving on every scroll is removed to allow fresh page refresh.
    // It is saved inside handleOpenThread when navigating to detail page instead.
  };

  const updateCachedPost = (postId, updater) => {
    if (!postId || typeof updater !== "function") return;

    queryClient.setQueriesData(
      { queryKey: DASHBOARD_POSTS_QUERY_ROOT },
      (cachedData) => {
        if (Array.isArray(cachedData)) {
          return cachedData.map((post) =>
            post.id === postId ? updater(post) : post,
          );
        }

        if (cachedData?.pages) {
          return {
            ...cachedData,
            pages: cachedData.pages.map((page) => ({
              ...page,
              posts: Array.isArray(page?.posts)
                ? page.posts.map((post) =>
                  post.id === postId ? updater(post) : post,
                )
                : page?.posts,
            })),
          };
        }

        if (cachedData?.id === postId) {
          return updater(cachedData);
        }

        return cachedData;
      },
    );
  };

  const removeCachedPost = (postId) => {
    if (!postId) return;

    queryClient.removeQueries({ queryKey: dashboardPostQueryKey(postId) });
    queryClient.setQueriesData(
      { queryKey: [...DASHBOARD_POSTS_QUERY_ROOT, "feed"] },
      (cachedData) => {
        if (Array.isArray(cachedData)) {
          return cachedData.filter((post) => post.id !== postId);
        }

        if (!cachedData?.pages) return cachedData;

        return {
          ...cachedData,
          pages: cachedData.pages.map((page) => ({
            ...page,
            posts: Array.isArray(page?.posts)
              ? page.posts.filter((post) => post.id !== postId)
              : page?.posts,
          })),
        };
      },
    );
  };

  const updateSinglePost = (updatedPost) => {
    const normalizedUpdatedPost = normalizePost(updatedPost);
    if (!normalizedUpdatedPost) return;

    queryClient.setQueryData(
      dashboardPostQueryKey(normalizedUpdatedPost.id),
      normalizedUpdatedPost,
    );
    queryClient.setQueriesData(
      { queryKey: [...DASHBOARD_POSTS_QUERY_ROOT, "feed"] },
      (cachedData) => {
        if (Array.isArray(cachedData)) {
          return cachedData.map((post) =>
            post.id === normalizedUpdatedPost.id ? normalizedUpdatedPost : post,
          );
        }

        if (!cachedData?.pages) return cachedData;

        return {
          ...cachedData,
          pages: cachedData.pages.map((page) => ({
            ...page,
            posts: Array.isArray(page?.posts)
              ? page.posts.map((post) =>
                post.id === normalizedUpdatedPost.id ? normalizedUpdatedPost : post,
              )
              : page?.posts,
          })),
        };
      },
    );
  };

  const isPostAuthor = (post) => {
    const sessionEmail = normalizeEmail(session?.user?.email);
    const authorEmail = normalizeEmail(post?.authorEmail);

    return Boolean(post?.canDeleteByCurrentUser || (sessionEmail && authorEmail && sessionEmail === authorEmail));
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

      removeCachedPost(deletePost.id);
      if (activePostId === deletePost.id) setActivePostId(null);
      if (sharePost?.id === deletePost.id) {
        setSharePost(null);
        setOpenShare(false);
      }
      setDeletePost(null);

      if (routePostId === deletePost.id) {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Could not delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handlePosted = (createdPost) => {
    const normalizedPost = normalizePost(createdPost);
    if (!normalizedPost || normalizedPost.audience !== selectedAudience) return;

    queryClient.setQueryData(
      dashboardFeedQueryKey(selectedAudience),
      (cachedData) => {
        if (!cachedData?.pages?.length) {
          return {
            pages: [{ posts: [normalizedPost], nextCursor: null, hasMore: false }],
            pageParams: [null],
          };
        }

        const seenPostIds = new Set([normalizedPost.id]);
        return {
          ...cachedData,
          pages: cachedData.pages.map((page, index) => {
            const existingPosts = Array.isArray(page?.posts) ? page.posts : [];
            const filteredPosts = existingPosts.filter((post) => {
              if (!post?.id || seenPostIds.has(post.id)) return false;
              seenPostIds.add(post.id);
              return true;
            });

            return {
              ...page,
              posts: index === 0 ? [normalizedPost, ...filteredPosts] : filteredPosts,
            };
          }),
        };
      },
    );
    queryClient.setQueryData(dashboardPostQueryKey(normalizedPost.id), normalizedPost);
  };

  const handlePollChange = (postId, nextPoll) => {
    if (!postId || !nextPoll) return;

    updateCachedPost(postId, (post) => ({ ...post, poll: nextPoll }));
  };

  const getImageGridClass = (count) => {
    if (count === 1) return "x-single-image";
    if (count === 2) return "image-grid count-2";
    if (count === 3) return "image-grid count-3";
    return "image-grid count-4";
  };

  const handleReportClick = (postId) => {
    setMenuPostId(null);
    setReportPostId(postId);
  };

  const handleOpenThread = (postId) => {
    if (!postId) return;

    const cachedPost = getCachedPost(postId);
    if (cachedPost) {
      queryClient.setQueryData(dashboardPostQueryKey(postId), cachedPost);
    }

    const currentFeedScroll = feedRef.current?.scrollTop ?? 0;
    persistFeedScroll(currentFeedScroll);
    rememberOpenPost(postId);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY, "true");
    }

    setMenuPostId(null);
    router.push(`/dashboard/post/${postId}`);
  };

  const handleOpenAuthorProfile = async (event, item) => {
    event.stopPropagation();
    // Support both posts and comments which may store author ID differently
    let authorId =
      typeof item?.authorId === "string"
        ? item.authorId.trim()
        : typeof item?.author?.id === "string"
          ? item.author.id.trim()
          : "";

    // If no authorId, try to fetch by email (for old comments)
    if (!authorId && typeof item?.authorEmail === "string" && item.authorEmail.trim()) {
      try {
        const res = await fetch(`/api/user/lookup?email=${encodeURIComponent(item.authorEmail)}`);
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

  const handleBackToFeed = () => {
    if (selectedThreadPost?.id) {
      rememberOpenPost(selectedThreadPost.id);
    }

    const openedFromFeed =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(DASHBOARD_OPENED_FROM_FEED_STORAGE_KEY) === "true";

    const openedFromExplore =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem("explore-post-opened-from-feed") === "true";

    if (typeof window !== "undefined") {
      // Storage cleanup is performed after scroll restoration, not here.
    }

    setMenuPostId(null);

    if (openedFromFeed || openedFromExplore) {
      router.back();
      return;
    }

    router.push("/dashboard");
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

      updateSinglePost(data.post);
      setActivePostId(null);
      if (routePostId !== postId) {
        rememberOpenPost(postId);
        router.push(`/dashboard/post/${postId}`);
      }
    } catch (error) {
      console.error(error);
      alert("Could not publish comment");
    }
  };

  const toggleSavePost = async (postId) => {
    if (!postId || pendingSavePostIdsRef.current.has(postId)) return;

    const cachedPost = getCachedPost(postId);
    const wasSaved = Boolean(cachedPost?.savedByCurrentUser);
    const previousBookmarkCount = Number(cachedPost?.bookmarkCount || 0);
    const optimisticSaved = !wasSaved;
    const optimisticBookmarkCount = Math.max(
      0,
      previousBookmarkCount + (optimisticSaved ? 1 : -1),
    );

    pendingSavePostIdsRef.current.add(postId);
    updateCachedPost(postId, (post) => ({
      ...post,
      savedByCurrentUser: optimisticSaved,
      bookmarkCount: optimisticBookmarkCount,
    }));

    try {
      const res = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Failed");
      }

      updateCachedPost(postId, (post) => ({
        ...post,
        savedByCurrentUser: Boolean(data.saved),
        bookmarkCount: Number(data.bookmarkCount ?? optimisticBookmarkCount),
      }));
    } catch (err) {
      console.error(err);
      updateCachedPost(postId, (post) => ({
        ...post,
        savedByCurrentUser: wasSaved,
        bookmarkCount: previousBookmarkCount,
      }));
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

    updateCachedPost(postId, (post) => {
      const nextLiked = !currentlyLiked;
      const nextLikeCount = Math.max(
        0,
        Number(post.likeCount || 0) + (nextLiked ? 1 : -1),
      );

      return {
        ...post,
        likedByCurrentUser: nextLiked,
        likeCount: nextLikeCount,
        likePending: true,
      };
    });

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

        updateCachedPost(postId, (post) => ({
          ...post,
          likedByCurrentUser: Boolean(data.likedByCurrentUser),
          likeCount: Number(data.likeCount || 0),
          likePending: false,
        }));
      } catch (error) {
        console.error(error);
        updateCachedPost(postId, (post) => {
          const rollbackLiked = currentlyLiked;
          return {
            ...post,
            likedByCurrentUser: rollbackLiked,
            likeCount: Math.max(
              0,
              Number(post.likeCount || 0) + (rollbackLiked ? 1 : -1),
            ),
            likePending: false,
          };
        });
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
      onClick={() => {
        if (!isThread) handleOpenThread(post.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!isThread) handleOpenThread(post.id);
        }
      }}
    >
      <div className="post-left">
        <button
          className="profilepic profile-link"
          type="button"
          disabled={!post.authorId}
          onClick={(event) => handleOpenAuthorProfile(event, post)}
          aria-label={`Open ${post.authorName || "author"} profile`}
        >
          <ReliableImage
            className="profileimg"
            src={post.authorImage}
            alt={post.authorName || "User"}
            fallbackSrc={buildAvatarFallback(post.authorName)}
            maxRetries={3}
          />
        </button>
      </div>

      <div className="post-right">
        <div className="posth">
          <div className="posth-left">
            <button
              className="post-author-link"
              type="button"
              disabled={!post.authorId}
              onClick={(event) => handleOpenAuthorProfile(event, post)}
            >
              <span className="user-name">
                {post.authorName || "UniLynk User"}
                {post.postAs === "club" && (
                  <Icon
                    icon="heroicons-solid:badge-check"
                    color="#1d9bf0"
                    width={18}
                  />
                )}
              </span>
              {post.postAs !== "club" && !!formatAuthorHandle(post.authorEmail) && (
                <span className="post-author-email">
                  {formatAuthorHandle(post.authorEmail)}
                </span>
              )}
            </button>
            <div className="dd-post-time">
              <span className="post-dot">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="4" cy="4" r="1.5" fill="grey" />
                </svg>
              </span>
              <div className="post-timeli">
                {formatRelativeTime(post.createdAt)}
              </div>
            </div>
          </div>
          <div className="posth-right">
            <button
              className="posth-right-btn"
              onClick={(e) => {
                e.stopPropagation();

                if (menuPostId === post.id) {
                  closeMenu();
                } else {
                  clearTimeout(window.menuCloseTimeout);

                  setClosingMenuId(null);
                  setMenuPostId(post.id);
                }
              }}
              aria-label="Post options"
              type="button"
            >
              <EllipsisVertical />
            </button>
            {menuPostId === post.id && (
              <div
                className={`post-dropdown-menu ${closingMenuId === post.id ? "closing" : ""
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="menu-item"
                  onClick={() => {
                    handleReportClick(post.id);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                    Delete Post
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

                  {post.savedByCurrentUser ?
                    <>
                      <Icon icon="mage:bookmark-cross" width={18} strokeWidth={2} />
                      Unsave Post
                    </>
                    : <>
                      <Icon icon="mage:bookmark" width={18} strokeWidth={2} />
                      Save Post
                    </>}
                </button>

                <button
                  className="menu-item"
                  onClick={() => {
                    setMenuPostId(null);
                    setSharePost(post);
                    setOpenShare(true);
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
                    onLoad={(e) => {
                      setImageRatios((prev) => ({
                        ...prev,
                        [post.id]: e.target.naturalWidth / e.target.naturalHeight,
                      }));
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

              <svg
                className={`post-foot-icon ${post.likedByCurrentUser ? "liked-heart" : ""
                  }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                width="22"
                height="22"
              >
                <rect width="256" height="256" fill="none" />

                <path
                  fill={post.likedByCurrentUser ? "#EC4899" : "none"}
                  stroke={post.likedByCurrentUser ? "#EC4899" : "#3e3e3e"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="16"
                  d="M128,216S28,160,28,92A52.00881,52.00881,0,0,1,128.00008,71.965l-.00019.00008A52.00881,52.00881,0,0,1,228,92C228,160,128,216,128,216Z"
                />
              </svg>
            </button>
            <span className="post-like-count">
              {Number(post.likeCount || 0)}
            </span>
          </div>
          <div className="post-foot-iconcont">
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent parent post click

                if (!post?.id) return;

                setActivePostId(post.id);
              }}
              type="button"
            >
              <img
                className="post-foot-icon"
                src="/Postimg/comment.svg"
                alt="Comment"
              />
            </button>
            <span className="post-comment-count">
              {Number(post.commentCount || 0)}
            </span>
          </div>
          <div className="post-foot-iconcont">
            <button
              onClick={() => {
                setSharePost(post);
                setOpenShare(true);
              }}
              type="button"
            >
              <img
                className="post-foot-icon"
                src="/Postimg/share.svg"
                alt="Share"
              />
            </button>
            <span className="post-share-count">0</span>
          </div>
          <div className="post-foot-iconcont">
            <button type="button" onClick={() => toggleSavePost(post.id)}>
              <svg
                className="post-foot-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="128"
                height="128"
                viewBox="0 0 128 128"
                fill={post.savedByCurrentUser ? "#dbdbdb" : "none"}
              >
                <path
                  stroke="#3e3e3e"
                  strokeWidth="7"
                  d="M78.978 20.8778C89.5889 23.625 96.9999 33.1992 96.9998 44.16L96.9995 67.8624L96.9997 88.1536C96.9999 100.313 96.9999 106.392 93.1442 108.331C89.2885 110.269 84.4088 106.643 74.6493 99.3908L72.3504 97.6824C68.3276 94.693 66.3161 93.1982 64 93.1982C61.6838 93.1983 59.6724 94.693 55.6495 97.6824L53.3505 99.3909C43.5911 106.643 38.7114 110.27 34.8557 108.331C31 106.393 31 100.313 31 88.1539L31 67.8624L31 44.1599C31 33.1992 38.4111 23.625 49.022 20.8778C58.8454 18.3345 69.1546 18.3345 78.978 20.8778Z"
                />
              </svg>
            </button>

            <span className="post-bookmark-count">
              {Number(post.bookmarkCount || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // The dashboard retains ownership of its React Query cache and mutations while
  // the shared component renders the card and dispatches interactions.
  const renderPostCard = (post, { isThread = false } = {}) => (
    <PostCard
      key={post.id}
      post={post}
      variant="dashboard"
      isThread={isThread}
      menuOpen={menuPostId === post.id}
      menuClosing={closingMenuId === post.id}
      postRef={isThread ? undefined : (node) => { if (node) postRefs.current[post.id] = node; else delete postRefs.current[post.id]; }}
      formatTime={formatRelativeTime}
      formatHandle={formatAuthorHandle}
      imageGridClass={getImageGridClass}
      avatarFallback={buildAvatarFallback}
      onOpenPost={handleOpenThread}
      onOpenAuthor={handleOpenAuthorProfile}
      onToggleMenu={() => {
        if (menuPostId === post.id) closeMenu();
        else { clearTimeout(window.menuCloseTimeout); setClosingMenuId(null); setMenuPostId(post.id); }
      }}
      onReport={handleReportClick}
      onDelete={handleDeleteClick}
      canDelete={isPostAuthor(post)}
      onLike={(id) => queueLikeToggle(id, Boolean(post.likedByCurrentUser))}
      onComment={(id) => setActivePostId(id)}
      onShare={(nextPost) => { setSharePost(nextPost); setOpenShare(true); }}
      onSave={toggleSavePost}
      pollContent={post.poll && <PollCard postId={post.id} poll={post.poll} onPollChange={(nextPoll) => handlePollChange(post.id, nextPoll)} />}
    />
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
          <button
            className="post-author-link"
            type="button"
            disabled={!comment.authorId && !comment.authorEmail}
            onClick={(event) => handleOpenAuthorProfile(event, comment)}
          >
            <span className="user-name">
              {comment.authorName || "UniLynk User"}
              {comment.postAs === "club" && (
                <Icon
                  icon="heroicons-solid:badge-check"
                  color="#1d9bf0"
                  width={18}
                />
              )}
            </span>
            {comment.postAs !== "club" && !!formatAuthorHandle(comment.authorEmail) && (
              <span className="post-author-email">
                {formatAuthorHandle(comment.authorEmail)}
              </span>
            )}
          </button>
          <span className="dd-post-time">
            <span className="post-dot">
              <svg
                width="8"
                height="8"
                viewBox="0 0 8 8"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="1.5" fill="grey" />
              </svg>
            </span>
            <span className="post-timeli">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </span>
        </div>
        {!!comment.content && (
          <div className="thread-comment-content">{comment.content}</div>
        )}
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
    <div className="homebody">
      {/* ── Mobile Header (hidden on desktop via CSS) ── */}
      <div className={`mobile-header${headerHidden ? ' mobile-header-hidden' : ''}`}>
        <button
          className="mobile-header-avatar-btn"
          type="button"
          aria-label="Open menu"
          onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-sidebar'))}
        >
          <img
            className="mobile-header-avatar"
            src={session?.user?.image || '/Profilepic.png'}
            alt={session?.user?.name || 'Profile'}
          />
        </button>

        <img src="/ULynk.svg" alt="ULynk" className="mobile-header-logo" />

        <div className="mobile-header-right">
          <button
            className="mobile-header-notif-btn"
            type="button"
            aria-label="Notifications"
            onClick={() => setMobileMsgOpen(true)}
          >
            <Icon icon={"solar:bell-line-duotone"} width={22} height={22} />
            {pendingNotifications.length > 0 && (
              <span className="mobile-notif-badge">
                {pendingNotifications.length > 9 ? '9+' : pendingNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="dashmain">
        {dashboardView === "explore" ? (
          <ExplorePage onBack={() => router.push("/dashboard")} />
        ) : (
          <>
            {!selectedThreadPost && (
              <div className={`feed-toggle-wrap ${headerHidden ? "feed-toggle-wrap-up" : ""}`}>
                <div className="pricing-toggle">
                  <div className={`toggle-track ${!isAnnual ? "right" : ""}`}>
                    <div className="toggle-bg"></div>
                    <button
                      type="button"
                      className={`toggle-btn ${isAnnual ? "active" : ""}`}
                      onClick={() => router.push("/dashboard")}
                    >
                      For You
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!isAnnual ? "active" : ""}`}
                      onClick={() => router.push("/dashboard/clubs")}
                    >
                      Clubs
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="feed" ref={feedRef} onScroll={handleFeedScroll}>
              <div
                className={`userposts ${selectedThreadPost ? "thread-userposts" : ""}`}
              >
                {(loadingPosts || !posts) && <Loading />}

                {!loadingPosts &&
                  Array.isArray(posts) &&
                  posts.length === 0 && (
                    <div className="noposts-illuistration">
                      <img src="/dashboard/NoPosts.svg" alt="No Posts" />
                      <h1 className="noposts-illuistrationh">No Posts Yet</h1>
                      <p className="noposts-illuistrationp">
                        It looks a little empty here. Check back later or be the
                        first to create something amazing!
                      </p>
                    </div>
                  )}

                {!loadingPosts && selectedThreadPost && (
                  <section
                    className="thread-view"
                    aria-label="Post thread view"
                  >
                    <div className="thread-view-header">
                      <button
                        type="button"
                        className="w-9 h-9 shrink-0 grid place-items-center rounded-full hover:bg-neutral-100 transition"
                        onClick={handleBackToFeed}
                      >
                        <ArrowLeft size={18} />

                      </button>
                      <div>
                        <h2 className="thread-view-title">Post</h2>
                      </div>
                    </div>

                    <div className="thread-view-content">
                      {renderPostCard(selectedThreadPost, { isThread: true })}

                      <div className="thread-replies-panel">
                        <div className="thread-replies-header-row">
                          <div>
                            <h3 className="thread-replies-title">Replies</h3>
                            <p className="thread-replies-subtitle">
                              Join the conversation under this post.
                            </p>
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
                            <div className="nocomment-illuistration">
                              <img src="/dashboard/nocomment.svg" alt="" />
                            </div>
                            <h4>No replies yet</h4>
                            <p>Be the first person to reply to this post.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}


                {!loadingPosts &&
                  Array.isArray(posts) &&
                  !selectedThreadPost &&
                  posts.map((post) => renderPostCard(post))}

                {!selectedThreadPost && <div ref={feedLoadMoreRef} aria-hidden="true" />}
              </div>

              <PostFab
                audience={selectedAudience}
                onPosted={handlePosted}
              />
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

            <PastEventNotifiModal
              isOpen={Boolean(activePastEvent)}
              onClose={() => setActivePastEvent(null)}
              event={activePastEvent}
              onSuccess={() => {
                if (activePastEvent) {
                  setPendingNotifications((prev) =>
                    prev.filter(
                      (evt) =>
                        evt.notificationType !== "past-event" ||
                        evt._id !== activePastEvent._id,
                    ),
                  );
                }
                setActivePastEvent(null);
              }}
            />

            <RequestModal
              open={Boolean(activeTeamRequest)}
              onClose={() => setActiveTeamRequest(null)}
              requester={{
                id: activeTeamRequest?.senderId,
                name: activeTeamRequest?.senderName || "Team Member",
                avatar: activeTeamRequest?.senderAvatar,
                email: activeTeamRequest?.senderEmail,
                message: activeTeamRequest?.message || "I'd like to join your team.",
              }}
              onAccept={() => handleTeamRequestDecision("accept")}
              onReject={() => handleTeamRequestDecision("decline")}
            />
          </>
        )}
      </main>
      <div className={`msgsidebar${mobileMsgOpen ? ' mobile-msg-open' : ''}`}>
        {/* Mobile close header — only rendered when overlay is open */}
        {mobileMsgOpen && (
          <div className="mobile-msgsidebar-header">
            <button
              className="mobile-msgsidebar-close"
              type="button"
              aria-label="Close"
              onClick={() => setMobileMsgOpen(false)}
            >
              <ArrowLeft size={20} />
            </button>
            <span className="mobile-msgsidebar-title">Notifications & News</span>
          </div>
        )}
        <div className="msgsidebarmain">
          <button
            type="button"
            onClick={() => router.push("/dashboard/explore")}
            aria-pressed={dashboardView === "explore"}
            className={`
               w-[325px] h-[54px]
               rounded-2xl border border-neutral-200
               backdrop-blur-md
               flex items-center justify-center gap-2
               text-[16px] font-semibold
               shadow-sm transition-all duration-300
               ${dashboardView === "explore"
                ? "bg-black text-white hover:bg-neutral-900"
                : "bg-white/90 text-neutral-900 hover:bg-[#fbfbfb]"
              }
             `}
          >
            <span>Explore Campus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <hr className="mt-4 mb-4" />
          <div className="relative flex rounded-lg bg-black/[0.06] p-0.5">
            <motion.div
              layout
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 32,
              }}
              className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
              style={{ left: mode === "newsletter" ? 2 : "50%" }}
            />
            {[
              { id: "newsletter", label: "News Letter", Icon: BookOpen },
              { id: "notification", label: "Notification", Icon: Bell },
            ].map(({ id, label, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => {
                  setMode(id);
                  setError(null);
                }}
                className={`relative z-10 flex flex-1 items-center cursor-pointer justify-center gap-1.5 rounded-md py-1.5 text-xs transition ${mode === id ? "text-black" : "text-black/50"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <hr className="mt-4 mb-4" />

          {mode === "notification" ? (
            <div className="notifi-box p-1.5 space-y-2">
              {pendingNotifications.length > 0 ? (
                pendingNotifications.map((notif) => {
                  const isTeamFinder =
                    notif.notificationType === "team-finder-request";
                  const isTeamFinderUpdate =
                    notif.notificationType === "team-finder-accepted" ||
                    notif.notificationType === "team-finder-declined";
                  return (
                    <div
                      key={`${notif.notificationType}-${notif._id}`}
                      onClick={async () => {
                        if (isTeamFinder) {
                          try {
                            const res = await fetch(`/api/users/profile?email=${encodeURIComponent(notif.senderEmail)}`);
                            const data = await res.json();
                            const enriched = { ...notif, senderAvatar: data.image };
                            setActiveTeamRequest(enriched);
                          } catch (e) {
                            console.error('Failed to fetch avatar', e);
                            setActiveTeamRequest(notif);
                          }
                        } else if (!isTeamFinderUpdate) {
                          setActivePastEvent(notif);
                        }
                      }}
                      className={`flex w-full min-h-[60px] items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white ${isTeamFinder ? "cursor-pointer" : "cursor-pointer"
                        }`}
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center">
                        {isTeamFinder || isTeamFinderUpdate ? (
                          <Bell className="h-5 w-5 text-neutral-700" />
                        ) : (
                          <ImageWithFallback
                            src={notif.clubLogo}
                            alt={notif.clubName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate text-black">
                          {notif.title}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">
                          {isTeamFinder || isTeamFinderUpdate
                            ? notif.body
                            : "Please update Past Activities Page"}
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-neutral-400">
                  No new notifications
                </div>
              )}
            </div>
          ) : (
            <div className="">
              <NewsLetterCard />
            </div>
          )}
        </div>
      </div>

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
