"use client"

import React from 'react'
import "./userprofile.css"
import Image from 'next/image'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

const Userprofile = () => {

    const { data: session, status } = useSession();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const YEAR_OFFSET = {
        "First Year": 0,
        "Second Year": 1,
        "Third Year": 2,
        "Fourth Year": 3,
        "Fifth Year": 4,
    };


    useEffect(() => {
        if (status !== "authenticated") {
            setLoading(false);
            return;
        }

        const getUserProfile = async () => {
            try {
                setLoading(true);
                const response = await fetch("/api/user/me", { cache: "no-store" });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Could not fetch user profile");
                }

                setProfile(data.user);
            } catch (fetchError) {
                setError(fetchError.message);
            } finally {
                setLoading(false);
            }
        };

        getUserProfile();
    }, [status]);

    const calculateSemesterFromYear = (year) => {
        if (!year) return "Not available";

        const yearMap = {
            "First Year": 0,
            "Second Year": 1,
            "Third Year": 2,
            "Fourth Year": 3,
            "Fifth Year": 4,
        };

        const baseYear = yearMap[year];
        if (baseYear === undefined) return "Not available";

        const now = new Date();
        const month = now.getMonth(); // Jan = 0, July = 6

        // July onwards = Odd semester
        const isOddSemester = month >= 6;

        return baseYear * 2 + (isOddSemester ? 1 : 2);
    };

    const getProgramDuration = (branch) => {
        if (!branch) return 4;

        // 5-year programs (Dual Degree + Architecture)
        if (
            branch.includes("5 Years") ||
            branch === "Architecture"
        ) {
            return 5;
        }

        // Default B.Tech
        return 4;
    };


    const calculateBatchFromBranchAndYear = (branch, year) => {
        if (!branch || !year) return "Not available";

        const offset = YEAR_OFFSET[year];
        if (offset === undefined) return "Not available";

        const duration = getProgramDuration(branch);

        const now = new Date();
        const currentYear = now.getFullYear();
        const month = now.getMonth(); // Jan = 0, July = 6

        // Academic year starts in July
        const academicYearStart = month >= 6 ? currentYear : currentYear - 1;

        const batchStart = academicYearStart - offset;
        const batchEnd = batchStart + duration;

        return `${batchStart} - ${batchEnd}`;
    };



    if (status === "loading" || loading) {
        return <div className="user-profile-page">Loading profile...</div>;
    }

    if (status !== "authenticated") {
        return <div className="user-profile-page">Please log in to view your profile.</div>;
    }

    if (error) {
        return <div className="user-profile-page">{error}</div>;
    }

    // const profile = {
    //     name: 'Pawan Kumar',
    //     title: 'Production and Industrial Engineering',
    //     avatar: 'https://akm-img-a-in.tosshub.com/sites/dailyo/story/embed/201809/painting_of_lord_kri_090118090030.jpg',
    //     course: 'Production and Industrial Engineering',
    //     branch: 'PIE',
    //     year: 'Third Year',
    //     semester: '5',
    //     batch: '2025-2029',
    //     club: 'Innovation Cell',
    //     skills: [
    //         { name: 'Python' },
    //         { name: 'React.js' },
    //         { name: 'Node.js' },
    //         { name: 'Machine Learning' },
    //         { name: 'SQL' },
    //         { name: 'Docker' }
    //     ],
    //     clubs: [
    //         { name: 'Innovatiion Cell', role: 'Technical Lead', year: '2024-Present' },
    //         { name: 'BIS', role: 'Vice President', year: '2024-Present' },
    //         { name: 'Photography Club', role: 'Member', year: '2023-Present' }
    //     ],
    //     achievements: [
    //         { title: 'Smart India Hackathon Winner', year: '2025', desc: 'First Prize - AI Category' },
    //         { title: 'Research Publication', year: '2024', desc: 'Published in IEEE Conference' },
    //         { title: 'Dean\'s List', year: '2024', desc: 'Academic Excellence Award' },
    //         { title: 'Competitive Programming', year: '2024', desc: 'Codeforces Expert (1600+)' }
    //     ]
    // };

    return (
        <div className="app-container">

            {/* Main Content Area */}
            <main className="main-area">
                {/* Top Bar */}
                <header className="top-bar">
                    <div className="search-box">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search students, clubs, events..." />
                    </div>
                </header>

                {/* Profile Content */}
                <div className="profile-content">
                    {/* Hero Section */}
                    <section className="hero-section">
                        <div className="hero-grid">
                            <div className="hero-left">
                                <div className="profile-image-wrapper">
                                    <img
                                        className="profile-img"
                                        src={profile?.img || session?.user?.image || "/Profilepic.png"}
                                        alt={`${profile?.name || "User"} profile`}
                                    />
                                </div>
                            </div>

                            <div className="hero-center">
                                <div className="name-section">
                                    <h1 className="profile-name">{profile?.name || session?.user?.name || "User"}</h1>

                                </div>
                                <p className="profile-title"> {profile?.branch || session?.user?.branch || "Not available"}</p>

                            </div>

                            <div className="hero-right">
                                <button className="action-btn primary-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Connect
                                </button>
                                <button className="action-btn secondary-btn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Message
                                </button>
                            </div>
                        </div>
                        <hr className='profilehr' />
                        <div className="social">
                            <button className='applogo' ><img src="/social/LinkedIn.svg" alt="LinkedIn" /></button>
                            <button className='applogo'><img src="/social/instagram.svg" alt="Instagram" /></button>
                            <button className='applogo'><img src="/social/X.svg" alt="X" /></button>
                            <button className='applogo'><img src="/social/github.svg" alt="GitHub" /></button>
                        </div>
                    </section>



                    <div className="info-card academic-card">
                        <h2 className="card-heading">Academic Information</h2>
                        <div className="academic-grid">
                            <div className="academic-item">
                                <span className="academic-label">Course</span>
                                <span className="academic-value">{profile?.branch || "Not available"}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Branch</span>
                                <span className="academic-value">{profile?.branch || "Not available"}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Current Year</span>
                                <span className="academic-value">{profile?.year}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Semester</span>
                                <span className="academic-value">
                                    {calculateSemesterFromYear(profile?.year)}
                                </span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Batch</span>
                                <span className="academic-value">
                                    {calculateBatchFromBranchAndYear(profile?.branch, profile?.year)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="skills-card">
                        <h2 className="skillscard-heading"><Image src="/userprofile/htmltag.svg" alt='Skills' width={30} height={30} /> Skills</h2>
                        <div className="card-container">
                            <div className="card">Card 1</div>
                            <div className="card">Card 2</div>


                        </div>

                    </div>


                </div>
            </main>
        </div>
    )
}

export default Userprofile
