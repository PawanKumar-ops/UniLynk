"use client"

import Image from 'next/image'
import "./Club.css"
import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link'
import { Sparkle } from 'lucide-react';
import { AddMembersModal } from '@/components/AddMembersFab';
import { MembersModal } from "@/components/ClubMembersModal";
import { PostsModal } from "@/components/ClubPostsModal";
import { Calendar, Users, Trophy, Heart } from 'lucide-react';

const Clubpage = () => {
    const searchParams = useSearchParams();
    const tabs = ["About", "Past Activities", "Upcoming Events"];
    const [active, setActive] = useState(0);
    const [showAddMembersFab, setAddMembersFab] = useState(false)
    const [MemberModalopen, setMemberModalOpen] = useState(false);
    const [postsModalOpen, setPostsModalOpen] = useState(false);
    const [clubData, setClubData] = useState(null);
    const clubPosts = [
        {
            id: "club-post-1",
            author: "Alexandra Chen",
            role: "President",
            timeAgo: "2h ago",
            category: "Announcement",
            title: "Welcome to Innovation Cell!",
            content: "Kickstarting the semester with maker sessions and idea jams. Stay tuned for weekly activities.",
            likes: 34,
            comments: 8,
        },
        {
            id: "club-post-2",
            author: "Marcus Rivera",
            role: "Vice President",
            timeAgo: "1d ago",
            category: "Event",
            title: "Design Sprint this Saturday",
            content: "Join us in Lab-3 at 10 AM. Bring your laptop and your best product ideas.",
            likes: 21,
            comments: 4,
        },
    ];
    const activityCards = [
        {
            id: 1,
            icon: Calendar,
            title: "",
            description: ""
        },
        {
            id: 2,
            icon: Users,
            title: "",
            description: ""
        },
        {
            id: 3,
            icon: Trophy,
            title: "",
            description: ""
        },
        {
            id: 4,
            icon: Heart,
            title: "",
            description: ""
        }
    ];

    useEffect(() => {
        const clubId = searchParams.get("clubId");
        if (!clubId) return;

        const fetchClub = async () => {
            try {
                const response = await fetch(`/api/clubs/${clubId}`, { cache: "no-store" });
                if (!response.ok) throw new Error("Failed to fetch club");
                const data = await response.json();
                setClubData(data?.club || data || null);
            } catch (error) {
                console.error("CLUB FETCH ERROR:", error);
                setClubData(null);
            }
        };

        fetchClub();
    }, [searchParams]);

    const sourceActivities = Array.isArray(clubData?.activities) ? clubData.activities : [];
    const populatedActivities = activityCards.map((card, idx) => ({
        ...card,
        title: sourceActivities[idx]?.title || "",
        description: sourceActivities[idx]?.description || "",
    }));

    const joinedLabel = clubData?.foundedDate ? `Joined ${clubData.foundedDate}` : "Joined recently";


    return (
        <div className='clubbody'>



            {/* ===========================Club banner and logo============================= */}
            <div className="clubbanner">
                <img src={clubData?.banner || "Background.jpg"} alt="" />
            </div>
            <div className="clublogocont">
                <div className="clublogo"><img src={clubData?.logo || "Defaultclublogo.svg"} alt="Clublogo" /></div>
            </div>
            <div className="club-edit-add-btncont">
                <button className='club-edit-add-btn club-add-btn'
                    onClick={() => setAddMembersFab(true)}>
                    Add Members
                </button>
                {showAddMembersFab && (
                    <AddMembersModal onClose={() => setAddMembersFab(false)} />
                )}

                <button className='club-edit-add-btn club-edit-btn'>Edit Profile</button>
            </div>
            {/* ===================================Club Name====================================== */}
            <div className="clubmain">
                <div className="clubnameinfo">
                    <h1 className='clubname'>{clubData?.clubName || "Club"}</h1>
                    <ul className='infoclub'>
                        <li className='clubgener'>{clubData?.category || "General"}</li>
                        <li className='membersnum'>{clubData?.memberCount || 0} Members</li>
                        <li className='joiningdate'>{joinedLabel}</li>
                    </ul>
                    <div className='flex gap-3'>
                        <button
                            onClick={() => setMemberModalOpen(true)}
                            className='clubcontactbtn rounded-full w-[130px]'>
                            Members
                        </button>
                        <MembersModal MemberModalopen={MemberModalopen} onClose={() => setMemberModalOpen(false)} />
                        <button
                            onClick={() => setPostsModalOpen(true)}
                            className='clubcontactbtn rounded-full w-[130px]'
                        >
                            Posts
                        </button>
                        <PostsModal
                            open={postsModalOpen}
                            onOpenChange={setPostsModalOpen}
                            clubName={clubData?.clubName || "Club"}
                            posts={clubPosts}
                        />
                    </div>
                </div>

                <hr />
                <div className="clubcontentcont">
                    <div className="clubtoggle">
                        <div className="toggle-wrapper">
                            <div
                                className="toggle-indicator"
                                style={{ transform: `translateX(${active * 100}%)` }}
                            />
                            {tabs.map((tab, index) => (
                                <button
                                    key={tab}
                                    className={`toggle-btn ${active === index ? "active" : ""}`}
                                    onClick={() => setActive(index)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="clubcontent">
                        {/* =================================About Club============================ */}
                        {active === 0 && (
                            <div className="tab-panel">
                                <div className="aboutclub">
                                    <h1 className="clubprofhead">About {clubData?.clubName || "Club"}</h1>
                                    <p className="abtclubp">{clubData?.description || ""}</p>
                                </div>

                                {/*================================== What we do============================== */}

                                <div className="whatwedo">
                                    <h1 className="clubprofhead">What We Do</h1>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-[32px]">
                                        {populatedActivities.map((activity) => {
                                            const Icon = activity.icon;

                                            return (
                                                <div
                                                    key={activity.id}
                                                    className="w-full h-[200px] rounded-[15px] border border-[rgb(230,230,230)] bg-[#f4f4f4] p-6 transition-all duration-300 ease-in-out flex flex-row hover:shadow-[0px_6px_9px_#4242421f] hover:-translate-y-[2px]"
                                                >
                                                    <div className="flex flex-col gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-[#e1e1e3] flex items-center justify-center group-hover:bg-[#d2d2d9] transition-colors">
                                                            <Icon className="w-6 h-6 text-primary" />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <h3 className="text-xl">{activity.title}</h3>
                                                            <p className="text-gray-500 leading-relaxed">{activity.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>


                                <div className="leadershipteam">
                                    <h1 className="clubprofhead mb-6">
                                        Leadership Team
                                    </h1>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[0, 1, 2, 3].map((index) => {
                                            const leader = clubData?.leaders?.[index];

                                            if (!leader) return null;

                                            return (
                                                <div
                                                    key={index}
                                                    className="bg-[#f4f4f4] border border-[rgb(230,230,230)] rounded-[20px] p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0px_6px_9px_#4242421f]"
                                                >
                                                    <div className="mb-4">
                                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-md flex items-center justify-center bg-white">
                                                            <img
                                                                src={leader.image || "/Profilepic.png"}
                                                                alt={leader.name}
                                                                className="w-full h-full object-cover object-center"
                                                            />
                                                        </div>

                                                    </div>

                                                    <h3 className="text-lg font-semibold text-black">
                                                        {leader.name || "Unknown"}
                                                    </h3>

                                                    <p className="text-gray-500 text-sm mt-1">
                                                        {leader.position || "Member"}
                                                    </p>
                                                </div>
                                            );
                                        })}
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
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                                            </svg>
                                                            {activity.date}
                                                        </span>
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                <circle cx="12" cy="10" r="3"></circle>
                                                            </svg>
                                                            {activity.location}
                                                        </span>
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                                <circle cx="9" cy="7" r="4"></circle>
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                            </svg>
                                                            {activity.participants} participants
                                                        </span>
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
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                                            </svg>
                                                            {event.date}
                                                        </span>
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <circle cx="12" cy="12" r="10"></circle>
                                                                <polyline points="12 6 12 12 16 14"></polyline>
                                                            </svg>
                                                            {event.time}
                                                        </span>
                                                        <span className="meta-item">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                <circle cx="12" cy="10" r="3"></circle>
                                                            </svg>
                                                            {event.location}
                                                        </span>
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
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${(event.registered / event.seats) * 100}%` }}
                                                        ></div>
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
        </div>
    )
}

export default Clubpage
