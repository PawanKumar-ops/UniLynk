"use client"

import React, { useEffect, useMemo, useState } from 'react';
import './dashboard.css';
import { Search } from 'lucide-react';
import PostFAB from '../../components/PostFAB';
import Post from '../../components/Post';
import { EllipsisVertical } from 'lucide-react';
import ReliableImage from '../../components/ReliableImage';
import CommentModal from '@/components/CommentModal';
import ShareModal from '@/components/ShareModal';

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

export default function DashboardClient() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [ispost, setIspost] = useState(false)
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [openShare, setOpenShare] = useState(false);
  const [menuPostId, setMenuPostId] = useState(null);

  const selectedAudience = useMemo(() => (isAnnual ? "for-you" : "clubs"), [isAnnual]);

  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/posts?audience=${selectedAudience}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch posts");
        setPosts(data.posts || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [selectedAudience]);

  const handlePosted = (createdPost) => {
    if (!createdPost || createdPost.audience !== selectedAudience) return;
    setPosts((prev) => [createdPost, ...prev]);
  };

  const getImageGridClass = (count) => {
    if (count <= 1) return "image-grid count-1";
    if (count === 2) return "image-grid count-2";
    if (count === 3) return "image-grid count-3";
    return "image-grid count-4";
  };

  const handleReportClick = () => {
    setIsMenuOpen(false);
    onReport(id);
  };

  return (
    <div className="homebody">





      <main className='dashmain'>

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

        <div className="feed">


          <div className="userposts">



            {/*================== One Card of user post ====================*/}
            {loadingPosts && <div className="userpostsloadani">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-3 border-black border-t-transparent animate-spin"></div>
              </div>
            </div>}
            {!loadingPosts && posts.length === 0 && <div className="noposts-illuistration">
              <img src="./dashboard/NoPosts.svg" alt="No Posts" />
              <h1 className='noposts-illuistrationh'>No Posts Yet</h1>
              <p className='noposts-illuistrationp'>It looks a little empty here. Check back later or be the first to create something amazing!</p>
            </div>}

            {!loadingPosts && posts.map((post) => (
              <div className="userpost" key={post._id}>
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
                    <div className="posth-right"><button
                      className='posth-right-btn' onClick={() =>
                        setMenuPostId(menuPostId === post._id ? null : post._id)
                      }
                      aria-label="Post options"><EllipsisVertical /></button>
                      {menuPostId === post._id && (
                        <div className="post-dropdown-menu">
                          <button className="menu-item" onClick={() => {
                            setMenuPostId(null);
                            handleReportClick(post._id);
                          }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Report Post
                          </button>
                          <button className="menu-item">
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
                            <img key={`${post._id}-${idx}`} src={imageUrl} alt="Post image" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="post-foot">
                    <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/thumb.svg" alt="Like" /><span className='post-like-count'>0</span></div>
                    <div className="post-foot-iconcont">
                      <button onClick={() => setActivePostId(post._id)}>
                        <img className='post-foot-icon' src="Postimg/comment.svg" alt="Comment" />
                      </button><span className='post-comment-count'>0</span>

                      <CommentModal
                        isOpen={activePostId === post._id}
                        onClose={() => setActivePostId(null)}
                      />
                    </div>
                    <div className="post-foot-iconcont">
                      <button onClick={() => { setSharePost(post); setOpenShare(true); }}>
                        <img className="post-foot-icon" src="Postimg/share.svg" alt="Share" />
                      </button>

                      <span className='post-share-count'>0</span></div>
                    <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/bookmark.svg" alt="bookmark" /><span className='post-bookmark-count'>0</span></div>

                  </div>
                </div>


              </div>






            ))}
          </div>





          {ispost ? (<Post setIspost={setIspost} audience={selectedAudience} onPosted={handlePosted} />) : (
            <PostFAB setIspost={setIspost} />)}

        </div>

        <ShareModal
          isOpen={openShare}
          postUrl={sharePost ? `https://yourapp.com/post/${sharePost._id}` : ''}
          postContent={sharePost?.content || ''}
          onClose={() => {
            setOpenShare(false);
            setSharePost(null);
          }}
        />
      </main >
      <div className="msgsidebar">
        <div className="msgsidebarmain">
          <div className="msgsearchbar">
            <Search className="searchicon" size={16} />
            <input
              className="searchinput"
              placeholder="Search"
              type="text"
            />
          </div>
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