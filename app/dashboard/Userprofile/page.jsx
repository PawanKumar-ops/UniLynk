"use client"

import React from 'react'
import "./userprofile.css"
import Image from 'next/image'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useMemo } from 'react';

const Userprofile = () => {

    const { data: session, status } = useSession();
    const [sessionUser, setSessionUser] = useState(null);
    const [viewedProfile, setViewedProfile] = useState(null);

    const [profileLoading, setProfileLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [error, setError] = useState("");
    const YEAR_OFFSET = {
        "First Year": 0,
        "Second Year": 1,
        "Third Year": 2,
        "Fourth Year": 3,
        "Fifth Year": 4,
    };






    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }

        const controller = new AbortController();
        setSearchLoading(true);

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/users/search?q=${encodeURIComponent(searchTerm)}`,
                    { signal: controller.signal }
                );
                const data = await res.json();
                setResults(data.results || []);
            } catch (err) {
                if (err.name !== "AbortError") setResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [searchTerm]);


    const suggestions = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return results;
    }, [results, searchTerm]);

    const handleSuggestionClick = async (item) => {
        if (item.type !== "user") return;

        try {
            setProfileLoading(true);

            const res = await fetch(`/api/users/${item.id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message);

            setViewedProfile(data.user); //  switch profile
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
            setSearchTerm("");
            setResults([]);
        }
    };







    useEffect(() => {
        if (status !== "authenticated") return;

        const getUserProfile = async () => {
            try {
                setProfileLoading(true);
                const res = await fetch("/api/user/me", { cache: "no-store" });
                const data = await res.json();

                if (!res.ok) throw new Error(data.message);

                setSessionUser(data.user);
                setViewedProfile(data.user); // default profile
            } catch (err) {
                setError(err.message);
            } finally {
                setProfileLoading(false);
            }
        };

        getUserProfile();
    }, [status]);

    const isOwnProfile = useMemo(() => {
        if (!sessionUser || !viewedProfile) return false;
        return sessionUser._id === viewedProfile._id;
    }, [sessionUser, viewedProfile]);

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



    if (status === "loading" || profileLoading) {
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
                    <div className="search-wrapper">
                        <div className="search-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>

                            <input
                                type="text"
                                placeholder="Search students, clubs, events..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {searchTerm.trim() && (
                            <div className="profile-suggestions">
                                {searchLoading ? (
                                    <div className="suggestion-empty">Searching...</div>
                                ) : results.length === 0 ? (
                                    <div className="suggestion-empty">No users or clubs found.</div>
                                ) : (
                                    results.map((item) => (
                                        <button
                                            key={`${item.type}-${item.id}`}
                                            className="suggestion-item"
                                            onClick={() => handleSuggestionClick(item)}
                                        >
                                            <img src={item.image} alt={item.name} />
                                            <div className="suggestion-text">
                                                <strong>{item.name}</strong>
                                                <span>{item.type === "club" ? "Club" : "User"}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
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
                                        src={viewedProfile?.img || "/Profilepic.png"}
                                        alt={`${viewedProfile?.name || "User"} profile`}
                                    />
                                </div>
                            </div>

                            <div className="hero-center">
                                <div className="name-section">
                                    <h1 className="profile-name">{viewedProfile?.name}</h1>

                                </div>
                                <p className="profile-title">{viewedProfile?.branch || "Not available"}</p>

                            </div>

                            <div className="hero-right">
                                {isOwnProfile ? (
                                    <button className="action-btn primary-btn">
                                        ✏️ Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button className="action-btn primary-btn">
                                            ➕ Connect
                                        </button>
                                        <button className="action-btn secondary-btn">
                                            Message
                                        </button>
                                    </>
                                )}
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
                                <span className="academic-value">{viewedProfile?.branch || "Not available"}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Branch</span>
                                <span className="academic-value">{viewedProfile?.branch || "Not available"}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Current Year</span>
                                <span className="academic-value">{viewedProfile?.year}</span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Semester</span>
                                <span className="academic-value">
                                    {calculateSemesterFromYear(viewedProfile?.year)}
                                </span>
                            </div>
                            <div className="academic-item">
                                <span className="academic-label">Batch</span>
                                <span className="academic-value">
                                    {calculateBatchFromBranchAndYear(viewedProfile?.branch, viewedProfile?.year)}
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
