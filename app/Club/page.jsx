"use client"

import Image from 'next/image'
import "./Club.css"
import { useState } from "react";
import Link from 'next/link'
import AddMembersFab from '@/components/AddMembersFab'

const Clubpage = () => {
    const tabs = ["About", "Past Activities", "Upcoming Events"];
    const [active, setActive] = useState(0);
    const [showAddMembersFab, setAddMembersFab] = useState(false)



    return (
        <div className='clubbody'>



            {/* ===========================Club banner and logo============================= */}
            <div className="clubbanner">
                <img src="Background.jpg" alt="" />
            </div>
            <div className="clublogocont">
                <div className="clublogo"><img src="Defaultclublogo.svg" alt="Clublogo" /></div>
            </div>
            <div className="club-edit-add-btncont">
                <button className='club-edit-add-btn club-add-btn'
                    onClick={() => setAddMembersFab(true)}>
                    Add Members
                </button>
                {showAddMembersFab && (
                    <AddMembersFab onClose={() => setAddMembersFab(false)} />
                )}

                <button className='club-edit-add-btn club-edit-btn'>Edit Profile</button>
            </div>
            {/* ===================================Club Name====================================== */}
            <div className="clubmain">
                <div className="clubnameinfo">
                    <h1 className='clubname'>Innovation Cell</h1>
                    <ul className='infoclub'>
                        <li className='clubgener'>Innovation</li>
                        <li className='membersnum'>123 Members</li>
                        <li className='joiningdate'>Joined Jan 2026</li>
                    </ul>

                    <button className='clubcontactbtn'>Contact</button>
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
                                    <h1 className="clubprofhead">About Innovation Cell</h1>
                                    <p className="abtclubp">Innovation Cell is a dynamic community of creative minds passionate about pushing boundaries in arts, technology, and media. We bring together students from diverse backgrounds to collaborate on groundbreaking projects, participate in workshops, and create meaningful impact through innovation.</p>
                                </div>

                                {/*================================== What we do============================== */}

                                <div className="whatwedo">
                                    <h1 className="clubprofhead">What We Do</h1>
                                    <div className="whatcardcont">
                                        <div className="whatcard"></div>
                                        <div className="whatcard"></div>
                                        <div className="whatcard"></div>
                                        <div className="whatcard"></div>
                                    </div>
                                </div>


                                <div className="leadershipteam">
                                    <h1 className="clubprofhead">Leadership Team</h1>
                                    <div className="leadershipcards">
                                        <div className="leadershipcard"></div>
                                        <div className="leadershipcard"></div>
                                        <div className="leadershipcard"></div>
                                        <div className="leadershipcard"></div>
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
