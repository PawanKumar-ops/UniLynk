"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './dashboard.css';
import { ArrowLeft, EllipsisVertical, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';
import PostFAB from '../../components/PostFAB';
import Post from '../../components/Post';
import ReliableImage from '../../components/ReliableImage';
import CommentModal from '@/components/CommentModal';
import ShareModal from '@/components/ShareModal';
import { ReportPostModal } from '@/components/ReportPostModal';
import { ExplorePage } from '@/components/ExplorePage';

const DASHBOARD_SCROLL_STORAGE_KEY = 'dashboard-feed-scroll-position';

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
  if (seconds < 60) return 'now';
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
  if (!comment || typeof comment !== 'object') return null;

  const candidateId = comment.id ?? comment._id ?? `comment-${index}`;
  const safeId = typeof candidateId === 'string' ? candidateId.trim() : String(candidateId || '').trim();

  return {
    ...comment,
    id: safeId || `comment-${index}`,
    images: Array.isArray(comment.images)
      ? comment.images.filter((image) => typeof image === 'string' && image.trim())
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

const isElementVisibleWithinContainer = (element, container) => {
  if (!(element instanceof HTMLElement) || !(container instanceof HTMLElement)) return false;

  const elementTop = element.offsetTop;
  const elementBottom = elementTop + element.offsetHeight;
  const containerTop = container.scrollTop;
  const containerBottom = containerTop + container.clientHeight;

  return elementTop >= containerTop && elementBottom <= containerBottom;
};

export default function DashboardClient() {
  const { data: session } = useSession();
  const [isAnnual, setIsAnnual] = useState(true);
  const [ispost, setIspost] = useState(false);
  const [posts, setPosts] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activePostId, setActivePostId] = useState(null);
  const [threadPostId, setThreadPostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);
  const [reportPostId, setReportPostId] = useState(null);
  const [dashboardView, setDashboardView] = useState('feed');

  const likeTimersRef = useRef({});
  const pendingLikePostIdsRef = useRef(new Set());
  const feedRef = useRef(null);
  const postRefs = useRef({});
  const restoreFeedScrollRef = useRef(0);
  const pendingRestorePostIdRef = useRef(null);
  const hasRestoredInitialFeedScrollRef = useRef(false);

  const selectedAudience = useMemo(() => (isAnnual ? "for-you" : "clubs"), [isAnnual]);
  const selectedThreadPost = useMemo(
    () => (Array.isArray(posts) ? posts.find((post) => post.id === threadPostId) ?? null : null),
    [posts, threadPostId]
  );

  useEffect(() => () => {
    Object.values(likeTimersRef.current).forEach((timer) => clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedFeedScroll = Number(window.sessionStorage.getItem(DASHBOARD_SCROLL_STORAGE_KEY) || 0);
    restoreFeedScrollRef.current = Number.isFinite(savedFeedScroll) ? savedFeedScroll : 0;
  }, []);

  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/posts?audience=${selectedAudience}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");
        const normalizedPosts = (data.posts || [])
          .map(normalizePost)
          .filter(Boolean);

        setPosts(normalizedPosts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPosts(false);
      }
    };

    setThreadPostId(null);
    setActivePostId(null);
    setMenuPostId(null);
    loadPosts();
  }, [selectedAudience]);

  const persistFeedScroll = (scrollTop) => {
    if (typeof window === 'undefined') return;

    const safeScrollTop = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
    restoreFeedScrollRef.current = safeScrollTop;
    window.sessionStorage.setItem(DASHBOARD_SCROLL_STORAGE_KEY, String(safeScrollTop));
  };

  useEffect(() => {
    if (loadingPosts || selectedThreadPost || !feedRef.current) return;

    const feedElement = feedRef.current;
    const shouldRestoreInitialScroll = !hasRestoredInitialFeedScrollRef.current;
    const shouldRestoreClickedPost = Boolean(pendingRestorePostIdRef.current);

    if (!shouldRestoreInitialScroll && !shouldRestoreClickedPost) return;

    const restorePostId = pendingRestorePostIdRef.current;

    const restoreFeedPosition = () => {
      const savedScrollTop = Number.isFinite(restoreFeedScrollRef.current) ? restoreFeedScrollRef.current : 0;
      feedElement.scrollTop = savedScrollTop;

      if (restorePostId) {
        const restorePostElement = postRefs.current[restorePostId];
        if (restorePostElement && !isElementVisibleWithinContainer(restorePostElement, feedElement)) {
          restorePostElement.scrollIntoView({ block: 'center' });
        }
      }

      hasRestoredInitialFeedScrollRef.current = true;
      pendingRestorePostIdRef.current = null;
    };

    const frameId = window.requestAnimationFrame(restoreFeedPosition);

    return () => window.cancelAnimationFrame(frameId);
  }, [loadingPosts, posts, selectedThreadPost]);

  const handleFeedScroll = () => {
    if (selectedThreadPost || !feedRef.current) return;
    persistFeedScroll(feedRef.current.scrollTop);
  };

  const handlePosted = (createdPost) => {
    const normalizedPost = normalizePost(createdPost);
    if (!normalizedPost || normalizedPost.audience !== selectedAudience) return;
    setPosts((prev) => [normalizedPost, ...(Array.isArray(prev) ? prev : [])]);
  };

  const updateSinglePost = (updatedPost) => {
    const normalizedUpdatedPost = normalizePost(updatedPost);
    if (!normalizedUpdatedPost) return;

    setPosts((prev) =>
      Array.isArray(prev)
        ? prev.map((post) => (post.id === normalizedUpdatedPost.id ? normalizedUpdatedPost : post))
        : prev
    );
  };

  const getImageGridClass = (count) => {
    if (count <= 1) return "image-grid count-1";
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

    const currentFeedScroll = feedRef.current?.scrollTop ?? 0;
    persistFeedScroll(currentFeedScroll);
    pendingRestorePostIdRef.current = postId;

    setThreadPostId(postId);
    setMenuPostId(null);
  };

  const handleBackToFeed = () => {
    if (selectedThreadPost?.id) {
      pendingRestorePostIdRef.current = selectedThreadPost.id;
    }

    setThreadPostId(null);
    setMenuPostId(null);
  };

  const handleCommentSubmit = async (postId, payload) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add comment');

      updateSinglePost(data.post);
      setActivePostId(null);
      setThreadPostId(postId);
    } catch (error) {
      console.error(error);
      alert('Could not publish comment');
    }
  };

  const queueLikeToggle = (postId, currentlyLiked) => {
    if (!postId || typeof postId !== "string") {
      console.error("Invalid post id:", postId);
      return;
    }

    if (pendingLikePostIdsRef.current.has(postId)) return;

    setPosts((prev) =>
      prev.map((post) => {
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
    );

    if (likeTimersRef.current[postId]) {
      clearTimeout(likeTimersRef.current[postId]);
    }

    likeTimersRef.current[postId] = setTimeout(async () => {
      pendingLikePostIdsRef.current.add(postId);

      try {
        const method = currentlyLiked ? 'DELETE' : 'POST';
        const res = await likePost(postId, method);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Failed to update like');
        }

        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                ...post,
                likedByCurrentUser: Boolean(data.likedByCurrentUser),
                likeCount: Number(data.likeCount || 0),
                likePending: false,
              }
              : post
          )
        );
      } catch (error) {
        console.error(error);
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id !== postId) return post;

            const rollbackLiked = currentlyLiked;
            return {
              ...post,
              likedByCurrentUser: rollbackLiked,
              likeCount: Math.max(0, Number(post.likeCount || 0) + (rollbackLiked ? 1 : -1)),
              likePending: false,
            };
          })
        );
      } finally {
        pendingLikePostIdsRef.current.delete(postId);
        delete likeTimersRef.current[postId];
      }
    }, 220);
  };

  const renderPostCard = (post, { isThread = false } = {}) => (
    <div
      className={`userpost ${menuPostId === post.id ? "menu-open" : ""} ${isThread ? 'thread-root-post' : ''}`}
      key={post.id}
      ref={isThread ? undefined : (node) => {
        if (node) {
          postRefs.current[post.id] = node;
        } else {
          delete postRefs.current[post.id];
        }
      }}
      onClick={() => handleOpenThread(post.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenThread(post.id);
        }
      }}
    >
      <div className="post-left">
        <div className="profilepic">
          <ReliableImage
            className='profileimg'
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
            <div className="user-name">{post.authorName || "UniLynk User"}</div>
            <div className="post-time"><span className='post-dot'><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
              <circle cx="4" cy="4" r="1.5" fill="grey" />
            </svg></span><div className='post-timeli'>{formatRelativeTime(post.createdAt)}</div></div>
          </div>
          <div className="posth-right">
            <button
              className='posth-right-btn'
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
                <button className="menu-item" onClick={() => {
                  handleReportClick(post.id);
                }}>
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
              className={`like-button ${post.likedByCurrentUser ? 'liked' : ''}`}
              type="button"
            >
              <img className='post-foot-icon' src="Postimg/thumb.svg" alt="Like" />
            </button>
            <span className='post-like-count'>{Number(post.likeCount || 0)}</span>
          </div>
          <div className="post-foot-iconcont">
            <button onClick={() => {
              if (!post?.id) return;
              setThreadPostId(post.id);
              setActivePostId(post.id);
            }} type="button">
              <img className='post-foot-icon' src="Postimg/comment.svg" alt="Comment" />
            </button>
            <span className='post-comment-count'>{Number(post.commentCount || 0)}</span>
          </div>
          <div className="post-foot-iconcont">
            <button onClick={() => { setSharePost(post); setOpenShare(true); }} type="button">
              <img className="post-foot-icon" src="Postimg/share.svg" alt="Share" />
            </button>
            <span className='post-share-count'>0</span>
          </div>
          <div className="post-foot-iconcont">
            <img className='post-foot-icon' src="Postimg/bookmark.svg" alt="bookmark" />
            <span className='post-bookmark-count'>0</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComment = (comment) => (
    <div className="thread-comment" key={comment.id}>
      <div className="thread-comment-avatar">
        <ReliableImage
          className='profileimg'
          src={comment.authorImage}
          alt={comment.authorName || 'User'}
          fallbackSrc={buildAvatarFallback(comment.authorName)}
          maxRetries={3}
        />
      </div>
      <div className="thread-comment-body">
        <div className="thread-comment-meta">
          <span className="user-name">{comment.authorName || 'UniLynk User'}</span>
          <span className="post-time">
            <span className='post-dot'><svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="1.5" fill="grey" /></svg></span>
            <span className='post-timeli'>{formatRelativeTime(comment.createdAt)}</span>
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
    <div className="homebody">
      <main className='dashmain'>
        {dashboardView === 'explore' ? (
          <ExplorePage />
        ) : (
          <>
        {!selectedThreadPost && (
          <div className="pricing-toggle">
            <div className={`toggle-track ${!isAnnual ? "right" : ""}`}>
              <div className="toggle-bg"></div>
              <button
                className={`toggle-btn ${isAnnual ? "active" : ""}`}
                onClick={() => setIsAnnual(true)}
              >
                For You
              </button>
              <button
                className={`toggle-btn ${!isAnnual ? "active" : ""}`}
                onClick={() => setIsAnnual(false)}
              >
                Clubs
              </button>
            </div>
          </div>
        )}

        <div className="feed" ref={feedRef} onScroll={handleFeedScroll}>
          <div className={`userposts ${selectedThreadPost ? "thread-userposts" : ""}`}>
            {(loadingPosts || !posts) && <Loading />}

            {!loadingPosts && Array.isArray(posts) && posts.length === 0 && <div className="noposts-illuistration">
              <img src="./dashboard/NoPosts.svg" alt="No Posts" />
              <h1 className='noposts-illuistrationh'>No Posts Yet</h1>
              <p className='noposts-illuistrationp'>It looks a little empty here. Check back later or be the first to create something amazing!</p>
            </div>}

            {!loadingPosts && selectedThreadPost && (
              <section className="thread-view" aria-label="Post thread view">
                <div className="thread-view-header">
                  <button
                    type="button"
                    className="thread-back-button"
                    onClick={handleBackToFeed}
                  >
                    <ArrowLeft size={18} />
                    <span>Back to feed</span>
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
                      <div className="nocomment-illuistration"><img src="./dashboard/nocomment.svg" alt="" /></div>
                      <h4>No replies yet</h4>
                      <p>Be the first person to reply to this post.</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {!loadingPosts && Array.isArray(posts) && !selectedThreadPost && posts.map((post) => renderPostCard(post))}
          </div>

          {ispost ? (<Post setIspost={setIspost} audience={selectedAudience} onPosted={handlePosted} />) : (
            <PostFAB setIspost={setIspost} />)}
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
        </>
        )}
      </main >
      <div className="msgsidebar">
        <div className="msgsidebarmain">
          {/* <div className="msgsearchbar">
            <Search className="searchicon" size={16} />
            <input
              className="searchinput"
              placeholder="Search"
              type="text"
            />
          </div> */}
          <button
            type="button"
            onClick={() => setDashboardView('explore')}
            aria-pressed={dashboardView === 'explore'}
            className={`
               w-[325px] h-[54px]
               rounded-2xl border border-neutral-200
               backdrop-blur-md
               flex items-center justify-center gap-2
               text-[16px] font-semibold
               shadow-sm transition-all duration-300
               ${dashboardView === 'explore'
                 ? 'bg-black text-white hover:bg-neutral-900'
                 : 'bg-white/90 text-neutral-900 hover:bg-[#f5f8fa]'}
             `}
          >
            <span>Explore Campus</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <hr className="mt-4" />
          <div className="msgbuttons">
            <button className="msgbutton">
              <img src="/Chat/Recent.svg" alt="Recent icon" />
              Recent
            </button>
            <button className="msgbutton">
              <img src="/Chat/Chats.svg" alt="Chats icon" />
              Chats
            </button>
            <button className="msgbutton">
              <img src="/Chat/Clubs.svg" alt="Clubs icon" />
              Clubs
            </button>
          </div>
          <hr className="mt-4 mb-4" />

          <div className="chat">
            <div className="chatheader">
              <div className="clublogo">
                <img src="/NITLOGO.webp" alt="NIT Logo" />
              </div>
              <div className="clubname">Innovation Cell</div>
            </div>

            <div className="allchats">
              <div className="msges">
                <div className="msgbar">
                  <input type="text" placeholder='Message' />
                  <button>
                    <img className='arrow-up' src="./Chat/Arrow-up.svg" alt="" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}
