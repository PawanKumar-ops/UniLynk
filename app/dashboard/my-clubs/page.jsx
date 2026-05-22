"use client"

import React, { useEffect, useState } from 'react'
import "./my-clubs.css"
import Notification from '@/components/Notification'

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
  const [isNotify, setIsNotify] = useState(false)
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

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
          <button className='browsemore'>Browse more <img src="/myclubs/arrowright.svg" alt="" /></button>
        </div>
      </div>

      {loading && <div>Loading clubs...</div>}

      {!loading && clubs.map((club) => (
        <div className="clubinfo" key={club._id}>
          <div className="clubimg">
            <img src={club.logo || "/Defaultclublogo.svg"} alt="" />
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
              <button className='open' onClick={() => window.location.href = "/Club"}>Open</button>
              <button className='viewfeed'>View Feed</button>
              <button className='events'>Events</button>
            </div>
          </div>
        </div>
      ))}

      {!loading && clubs.length === 0 && <div>No leadership clubs found.</div>}

      <hr className='mb-8' />

      <div className="exploremore">Explore More</div>
      <div className="myclubsmorecont">
        <div className="myclubsmore">
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
        </div>

        <div className="myclubsmore">
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
        </div>
      </div>

    </div>
  )
}

export default MyClubsPage
