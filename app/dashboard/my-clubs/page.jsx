"use client"

import React, { useEffect, useState } from 'react';
import "./my-clubs.css";
import Notification from '@/components/Notification';
import { AllClubsModal } from '@/components/AllClubsModal';
import { ClubPostsModal } from "@/components/ClubPostsModal";

const getJoinedLabel = (foundedDate, createdAt) => {
  if (typeof foundedDate === "string" && foundedDate.trim()) {
    return `Joined ${foundedDate}`;
  }

  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return `Joined ${parsed.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
    }
  }

  return "Joined recently";
};

const getLastPostLabel = (updatedAt) => {
  if (!updatedAt) return "No recent updates";

  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(updatedDate.getTime())) return "No recent updates";

  return `Last updated ${updatedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

const MyClubsPage = () => {
  const [isNotify, setIsNotify] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAllClubsModalOpen, setIsAllClubsModalOpen] = useState(false);
  const [clubpostsModalOpen, setClubPostsModalOpen] = useState(false);
  const [clubData, setClubData] = useState(null);
  const [clubPosts, setClubPosts] = useState([]);

  useEffect(() => {
    const fetchMyClubs = async () => {
      try {
        const response = await fetch("/api/clubs?leadershipOnly=true", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch clubs");

        const data = await response.json();
        setClubs(Array.isArray(data?.clubs) ? data.clubs : []);
      } catch (error) {
        console.error("MY CLUBS FETCH ERROR:", error);
        setClubs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyClubs();
  }, []);

  return (
    <div className='my-clubsbody'>
      <div className="myclubshead">
        <div className="myclubsheader">
          <div className="campuscom">Campus Community</div>
          <div className="myclubs">My Clubs</div>
        </div>
        <div className="browsemorebtn">
          <button
            onClick={() => window.location.href = "/dashboard/explore"}
            className='browsemore'>Browse more <img src="/myclubs/arrowright.svg" alt="" /></button>
        </div>
      </div>

      {loading && <div>Loading clubs...</div>}

      {!loading && clubs.map((club) => (
        <div className="clubinfo" key={club._id}>
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${club.logo
              ? ""
              : "bg-gradient-to-br from-violet-500 to-fuchsia-500 p-2 shadow-md"
              }`}
          >
            <img
              src={club.logo || "/Defaultclublogo.svg"}
              alt="Club Logo"
              className={`object-contain ${club.logo ? "h-16 w-16 rounded-[15px]" : "h-10 w-10"
                }`}
            />
          </div>
          <div className="aboutclub">
            <div className="club-name">{club.clubName}
              <button onClick={() => setIsNotify(true)}>
                <div className="notify">
                  <img src="/myclubs/bell.svg" alt="notification" />
                  0
                </div>
              </button>
              {isNotify && <Notification onClose={() => setIsNotify(false)} />}
            </div>
            <ul>
              <li className='clubgenre'>{club.category || "General"}</li>
              <li>{club.memberCount || 0} members</li>
              <li>{getJoinedLabel(club.foundedDate, club.createdAt)}</li>
            </ul>
            <div className="post-time">
              <div className="userpostcapsule">Leadership Team</div>
              <img src="/myclubs/pulse.svg" alt="pulse" />
              <div className="lastpost">{getLastPostLabel(club.updatedAt)}</div>
            </div>
            <div className="clubinfobtns">
              <button className='open' onClick={() => window.location.href = `/Club?clubId=${club._id}`}>Open</button>
              <button
                onClick={async () => {
                  // Set current club data for modal
                  setClubData(club);
                  // Fetch posts for this club
                  try {
                    const resp = await fetch(`/api/posts?clubId=${club._id}`, { cache: "no-store" });
                    if (!resp.ok) throw new Error('Failed to fetch club posts');
                    const result = await resp.json();
                    setClubPosts(Array.isArray(result?.posts) ? result.posts : []);
                  } catch (err) {
                    console.error('Club posts fetch error:', err);
                    setClubPosts([]);
                  }
                  setClubPostsModalOpen(true);
                }}
                className='viewfeed'>View Feed</button>
              <ClubPostsModal
                open={clubpostsModalOpen}
                onOpenChange={setClubPostsModalOpen}
                clubName={clubData?.clubName || "Club"}
                clubLogo={clubData?.logo || "/Defaultclublogo.svg"}
                posts={clubPosts}
              />
              <button
                onClick={() => window.location.href = "/dashboard/events"}
                className='events'>Events</button>
            </div>
          </div>
        </div>
      ))}

      {!loading && clubs.length === 0 && <div className="flex flex-col justify-center items-center h-[60vh]">
        <img
          src="/myclubs/NoClubs.svg"
          alt="No Clubs"
          className="mb-8"
        />

        <h2 className="text-2xl mb-3 text-black">
          You Are Not In Any Club
        </h2>

        <p className="w-[464px] text-center text-gray-500">
          You haven’t joined any clubs yet. Explore different communities and become
          a part of exciting campus activities.
        </p>
      </div>}

      <hr className='mb-8' />

      <div className="exploremore">Explore More</div>
      <div className="myclubsmorecont">
        <button className="myclubsmore" onClick={() => setIsAllClubsModalOpen(true)}>
          <div className="myclubsmorer">
            <div className="myclubsmoreimg myclubsmoreimgsearch">
              <img src="/myclubs/Search.svg" alt="Search" />
            </div>
            <div className="myclubsmoret">
              <div>Browse All Clubs</div>
              <p>Discover new communities</p>
            </div>
          </div>

          <div className="myclubsarrow">
            <img src="/myclubs/arrow.svg" alt="" />
          </div>
        </button>

        <button className="myclubsmore" onClick={() => window.location.href = "/dashboard/explore"}>
          <div className="myclubsmorer">
            <div className="myclubsmoreimg myclubsmoreimgtrending">
              <img src="/myclubs/trending.svg" alt="trending" />
            </div>
            <div className="myclubsmoret">
              <div>Trending Clubs</div>
              <p>See what's popular</p>
            </div>
          </div>

          <div className="myclubsarrow">
            <img src="/myclubs/arrow.svg" alt="" />
          </div>
        </button>
      </div>

      <AllClubsModal
        open={isAllClubsModalOpen}
        onClose={() => setIsAllClubsModalOpen(false)}
      />
    </div>
  )
}

export default MyClubsPage
