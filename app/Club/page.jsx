"use client"

import React from 'react'
import Image from 'next/image'
import "./Club.css"
import { useState } from 'react'

const Clubpage = () => {
    const tabs = ["About", "Past Activities", "Upcoming Events"];
    const [active, setActive] = useState(0);



    return (
        <div className='clubbody'>



            {/* ===========================Club banner and logo============================= */}
            <div className="clubbanner">
                <img src="Background.jpg" alt="" />
            </div>
            <div className="clublogocont">
                <div className="clublogo"><img src="Defaultclublogo.svg" alt="Clublogo" /></div>
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


                </div>
            </div>
        </div>
    )
}

export default Clubpage
