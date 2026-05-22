"use client"

import "./Club.css"
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AddMembersFab from '@/components/AddMembersFab';
import { MembersModal } from "@/components/ClubMembersModal";
import { PostsModal } from "@/components/ClubPostsModal";
import { Calendar, Users, Trophy, Heart } from 'lucide-react';

const defaultActivities = [
  { id: 1, icon: Calendar },
  { id: 2, icon: Users },
  { id: 3, icon: Trophy },
  { id: 4, icon: Heart },
];

const clubPosts = [];

const getJoinedLabel = (foundedDate, createdAt) => {
  if (typeof foundedDate === "string" && foundedDate.trim()) return `Joined ${foundedDate}`;
  if (!createdAt) return "Joined recently";

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return "Joined recently";

  return `Joined ${parsed.toLocaleString("en-US", { month: "short", year: "numeric" })}`;
};

const Clubpage = () => {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");
  const tabs = ["About", "Past Activities", "Upcoming Events"];
  const [active, setActive] = useState(0);
  const [showAddMembersFab, setAddMembersFab] = useState(false)
  const [MemberModalopen, setMemberModalOpen] = useState(false);
  const [postsModalOpen, setPostsModalOpen] = useState(false);
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClub = async () => {
      if (!clubId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/clubs?clubId=${clubId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch club");

        const data = await response.json();
        setClub(data?.club ?? null);
      } catch (error) {
        console.error("CLUB FETCH ERROR:", error);
        setClub(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [clubId]);

  const activityCards = useMemo(() => (
    defaultActivities.map((item, index) => {
      const dbActivity = club?.activities?.[index] ?? null;
      return {
        ...item,
        title: dbActivity?.title ?? "",
        description: dbActivity?.description ?? "",
      };
    })
  ), [club]);

  const leadershipCards = useMemo(() => {
    const leaders = Array.isArray(club?.leaders) ? club.leaders.slice(0, 4) : [];
    return Array.from({ length: 4 }, (_, index) => leaders[index] ?? null);
  }, [club]);

  return (
    <div className='clubbody'>
      <div className="clubbanner">
        <img src={club?.banner || "/Background.jpg"} alt="" />
      </div>
      <div className="clublogocont">
        <div className="clublogo"><img src={club?.logo || "/Defaultclublogo.svg"} alt="Clublogo" /></div>
      </div>
      <div className="club-edit-add-btncont">
        <button className='club-edit-add-btn club-add-btn' onClick={() => setAddMembersFab(true)}>
          Add Members
        </button>
        {showAddMembersFab && <AddMembersFab onClose={() => setAddMembersFab(false)} />}

        <button className='club-edit-add-btn club-edit-btn'>Edit Profile</button>
      </div>
      <div className="clubmain">
        <div className="clubnameinfo">
          <h1 className='clubname'>{club?.clubName || "Club"}</h1>
          <ul className='infoclub'>
            <li className='clubgener'>{club?.category || "General"}</li>
            <li className='membersnum'>{club?.memberCount || 0} Members</li>
            <li className='joiningdate'>{getJoinedLabel(club?.foundedDate, club?.createdAt)}</li>
          </ul>
          <div className='flex gap-3'>
            <button onClick={() => setMemberModalOpen(true)} className='clubcontactbtn rounded-full w-[130px]'>
              Members
            </button>
            <MembersModal MemberModalopen={MemberModalopen} onClose={() => setMemberModalOpen(false)} />
            <button onClick={() => setPostsModalOpen(true)} className='clubcontactbtn rounded-full w-[130px]'>
              Posts
            </button>
            <PostsModal open={postsModalOpen} onOpenChange={setPostsModalOpen} clubName={club?.clubName || "Club"} posts={clubPosts} />
          </div>
        </div>

        <hr />
        <div className="clubcontentcont">
          <div className="clubtoggle">
            <div className="toggle-wrapper">
              <div className="toggle-indicator" style={{ transform: `translateX(${active * 100}%)` }} />
              {tabs.map((tab, index) => (
                <button key={tab} className={`toggle-btn ${active === index ? "active" : ""}`} onClick={() => setActive(index)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="clubcontent">
            {active === 0 && (
              <div className="tab-panel">
                <div className="aboutclub">
                  <h1 className="clubprofhead">About {club?.clubName || "Club"}</h1>
                  <p className="abtclubp">{club?.description || ""}</p>
                </div>

                <div className="whatwedo">
                  <h1 className="clubprofhead">What We Do</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[32px]">
                    {activityCards.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id} className="w-full h-[200px] rounded-[15px] border border-[rgb(230,230,230)] bg-[#f4f4f4] p-6 transition-all duration-300 ease-in-out flex flex-row hover:shadow-[0px_6px_9px_#4242421f] hover:-translate-y-[2px]">
                          <div className="flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center transition-colors">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-foreground">{activity.title}</h3>
                              <p className="text-muted-foreground leading-relaxed">{activity.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="leadershipteam">
                  <h1 className="clubprofhead">Leadership Team</h1>
                  <div className="leadershipcards">
                    {leadershipCards.map((leader, index) => (
                      <div className="leadershipcard" key={`leader-${index}`}>
                        {leader && (
                          <div className="flex flex-col items-center text-center gap-2">
                            <img src={leader.image || "/Profilepic.png"} alt={leader.email} className="w-14 h-14 rounded-full object-cover" />
                            <div className="font-semibold text-black text-sm break-all">{leader.email}</div>
                            <div className="text-xs text-gray-500">{leader.position}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PAST ACTIVITIES */}
            {active === 1 && (
              <div className="tab-panel">
                <h2 className="section-title">Past Activities</h2>

                <div className="activities-list">
                  {[
                    {
                      title: "Design Thinking Workshop 2025",
                      date: "Jan 15, 2026",
                      location: "Main Auditorium",
                      participants: 120,
                      description: "An intensive workshop on design thinking methodology with hands-on activities and real-world case studies."
                    },
                    {
                      title: "Innovation Hackathon",
                      date: "Dec 10-12, 2025",
                      location: "Tech Lab",
                      participants: 85,
                      description: "A 48-hour hackathon focused on solving campus and community problems through innovative technology solutions."
                    },
                    {
                      title: "AI in Creative Arts Seminar",
                      date: "Nov 20, 2025",
                      location: "Lecture Hall B",
                      participants: 150,
                      description: "Explored the intersection of artificial intelligence and creative industries with guest speakers from leading tech companies."
                    },
                    {
                      title: "Annual Innovation Fest",
                      date: "Oct 5-7, 2025",
                      location: "Campus Grounds",
                      participants: 300,
                      description: "Our flagship event showcasing student projects, exhibitions, performances, and innovation challenges."
                    }
                  ].map((activity, index) => (
                    <article key={index} className="activity-card">
                      <div className="activity-header">
                        <div className="activity-info">
                          <h3 className="activity-title">{activity.title}</h3>
                          <div className="activity-meta">
                            <span className="meta-item">{activity.date}</span>
                            <span className="meta-item">{activity.location}</span>
                            <span className="meta-item">{activity.participants} participants</span>
                          </div>
                        </div>
                        <span className="activity-badge">Completed</span>
                      </div>
                      <p className="activity-description">{activity.description}</p>

                      <div className="photo-gallery">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="photo-placeholder"></div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* UPCOMING EVENTS */}
            {active === 2 && (
              <div className="tab-panel">
                <h2 className="section-title">Upcoming Events</h2>

                <div className="events-list">
                  {[
                    {
                      title: "Web3 & Blockchain Workshop",
                      date: "Feb 20, 2026",
                      time: "2:00 PM - 5:00 PM",
                      location: "Computer Lab 3",
                      seats: 40,
                      registered: 28,
                      description: "Learn the fundamentals of blockchain technology and explore Web3 development opportunities."
                    },
                    {
                      title: "Creative Photography Walk",
                      date: "Feb 25, 2026",
                      time: "6:00 AM - 9:00 AM",
                      location: "Campus & Nearby Areas",
                      seats: 30,
                      registered: 22,
                      description: "Join us for an early morning photography session capturing the beauty of campus life and nature."
                    },
                    {
                      title: "Startup Pitch Competition",
                      date: "Mar 5, 2026",
                      time: "10:00 AM - 4:00 PM",
                      location: "Innovation Hub",
                      seats: 50,
                      registered: 35,
                      description: "Present your startup ideas to a panel of investors and entrepreneurs. Winners get seed funding!"
                    },
                    {
                      title: "Digital Art Masterclass",
                      date: "Mar 12, 2026",
                      time: "3:00 PM - 6:00 PM",
                      location: "Design Studio",
                      seats: 25,
                      registered: 18,
                      description: "Advanced techniques in digital illustration and motion graphics with industry professional."
                    }
                  ].map((event, index) => (
                    <article key={index} className="event-card">
                      <div className="event-header">
                        <div className="event-info">
                          <h3 className="event-title">{event.title}</h3>
                          <div className="event-meta">
                            <span className="meta-item">{event.date}</span>
                            <span className="meta-item">{event.time}</span>
                            <span className="meta-item">{event.location}</span>
                          </div>
                        </div>
                        <span className="event-badge">Upcoming</span>
                      </div>

                      <p className="event-description">{event.description}</p>

                      <div className="event-footer">
                        <div className="seats-info">
                          <div className="seats-text">
                            Seats: <strong>{event.registered}/{event.seats}</strong>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(event.registered / event.seats) * 100}%` }}></div>
                          </div>
                        </div>
                        <button className="btn-register">Register Now</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {!clubId && !loading && <p className="text-sm text-gray-500 mb-8">No club selected.</p>}
    </div>
  )
}

export default Clubpage
