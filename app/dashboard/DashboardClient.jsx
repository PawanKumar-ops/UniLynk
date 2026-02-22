"use client"

import React, { useEffect, useMemo, useState } from 'react';
import './dashboard.css';
import { Search } from 'lucide-react';
import PostFAB from '../../components/PostFAB';
import Post from '../../components/Post';
import { EllipsisVertical } from 'lucide-react';
import ReliableImage from '../../components/ReliableImage';

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
            {loadingPosts && <div className="userpost"><div className="post-right">Loading posts...</div></div>}
            {!loadingPosts && posts.length === 0 && <div className="userpost"><div className="post-right">No posts yet. Create one!</div></div>}

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
                      <div className="post-time"><ul><li className='post-timeli'>{formatRelativeTime(post.createdAt)}</li></ul></div>
                    </div>
                    <div className="posth-right"><button className='posth-right-btn'><EllipsisVertical /></button></div>
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
                    <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/comment.svg" alt="Comment" /><span className='post-comment-count'>0</span></div>
                    <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/share.svg" alt="Share" /><span className='post-share-count'>0</span></div>
                    <div className="post-foot-iconcont"><img className='post-foot-icon' src="Postimg/bookmark.svg" alt="Share" /><span className='post-share-count'>0</span></div>

                  </div>
                </div>


              </div>






            ))}
          </div>





          {ispost ? (<Post setIspost={setIspost} audience={selectedAudience} onPosted={handlePosted} />) : (
            <PostFAB setIspost={setIspost} />)}

        </div>

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
