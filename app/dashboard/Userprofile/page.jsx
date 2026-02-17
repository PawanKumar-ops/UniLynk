"use client"

import React from 'react'
import "./userprofile.css"
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useMemo } from 'react';
import { Icon } from "@iconify/react";
import { getSkillIcon } from "@/lib/skillIcons";
import ProfileEditModal from '@/components/ProfileEditModal'

const Userprofile = () => {

    const { data: session, status } = useSession();
    const [sessionUser, setSessionUser] = useState(null);
    const [viewedProfile, setViewedProfile] = useState(null);
    const [showEditProfileModal, setEditProfileModal] = useState(false)
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

        return <div className="loadcont">
            <div className="flowing-bars">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="bar"
                        animate={{
                            height: ["20%", "100%", "20%"],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
            {/* Loading text with elegant animation */}
            <div className="text-section">
                <motion.h1
                    className="loading-text"
                    animate={{
                        opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    Loading
                </motion.h1>

                {/* Progress line */}
                <div className="progress-container">
                    <motion.div
                        className="progress-bar"
                        animate={{
                            x: ["-100%", "100%"],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    />
                </div>
            </div>
        </div>;
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


                    {!isOwnProfile && (
                        <button
                            className="action-btn secondary-btn"
                            onClick={() => setViewedProfile(sessionUser)}
                        >
                            ← Back to My Profile
                        </button>
                    )}



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
                                    <>
                                        <button
                                            className="action-btn primary-btn"
                                            onClick={() => setEditProfileModal(true)}
                                        >
                                            <img className='editprofile-icon' src="/Userprofile/editprofile.svg" />
                                            Edit Profile
                                        </button>

                                        {showEditProfileModal && (
                                            <ProfileEditModal onClose={() => setEditProfileModal(false)} />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button className="action-btn primary-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                            </svg>
                                            Connect
                                        </button>
                                        <button className="action-btn secondary-btn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" id="message">
                                                <path fill="#000" fillRule="evenodd" d="M17.4635 2.37373C16.3214 2.24999 14.8818 2.24999 13.0452 2.25H10.9548C9.11821 2.24999 7.67861 2.24999 6.53648 2.37373C5.37094 2.50001 4.42656 2.76232 3.62024 3.34815C3.13209 3.70281 2.70281 4.13209 2.34815 4.62024C2.18647 4.84277 2.04801 5.07781 1.92987 5.32797C1.56808 6.09404 1.40671 6.98237 1.32806 8.04168C1.25 9.09323 1.25 10.3822 1.25 11.9716V12.0452C1.24999 13.8818 1.24999 15.3214 1.37373 16.4635C1.50001 17.6291 1.76232 18.5734 2.34815 19.3798C2.70281 19.8679 3.13209 20.2972 3.62024 20.6518C4.42656 21.2377 5.37094 21.5 6.53648 21.6263C7.67859 21.75 9.11817 21.75 10.9547 21.75H13.0453C14.8818 21.75 16.3214 21.75 17.4635 21.6263C18.6291 21.5 19.5734 21.2377 20.3798 20.6518C20.8679 20.2972 21.2972 19.8679 21.6518 19.3798C22.2377 18.5734 22.5 17.6291 22.6263 16.4635C22.75 15.3214 22.75 13.8818 22.75 12.0453V11.9709C22.75 10.3707 22.75 9.07486 22.6702 8.01904C22.5899 6.95506 22.4248 6.06379 22.0546 5.29546C21.9399 5.05734 21.8065 4.83304 21.6518 4.62024C21.2972 4.13209 20.8679 3.70281 20.3798 3.34815C19.5734 2.76232 18.6291 2.50001 17.4635 2.37373ZM4.50191 4.56168C5.00992 4.19259 5.66013 3.97745 6.69804 3.865C7.74999 3.75103 9.10843 3.75 11 3.75H13C14.8916 3.75 16.25 3.75103 17.302 3.865C18.3399 3.97745 18.9901 4.19259 19.4981 4.56168C19.8587 4.82369 20.1759 5.14081 20.4379 5.50139L18.5407 7.39861C16.8591 9.08026 15.6501 10.287 14.6072 11.0827C13.5817 11.8651 12.8056 12.1789 12 12.1789C11.1944 12.1789 10.4183 11.8651 9.39275 11.0827C8.34994 10.287 7.14092 9.08026 5.45926 7.3986L3.56205 5.50139C3.82412 5.14081 4.14128 4.82369 4.50191 4.56168ZM21.0373 7.02337C21.0977 7.34361 21.1425 7.70891 21.1745 8.13204C21.2495 9.12493 21.25 10.3648 21.25 12C21.25 13.8916 21.249 15.25 21.135 16.302C21.0225 17.3399 20.8074 17.9901 20.4383 18.4981C20.1762 18.8589 19.8589 19.1762 19.4981 19.4383C18.9901 19.8074 18.3399 20.0225 17.302 20.135C16.25 20.249 14.8916 20.25 13 20.25H11C9.10843 20.25 7.74999 20.249 6.69804 20.135C5.66013 20.0225 5.00992 19.8074 4.50191 19.4383C4.14111 19.1762 3.82382 18.8589 3.56168 18.4981C3.19259 17.9901 2.97745 17.3399 2.865 16.302C2.75103 15.25 2.75 13.8916 2.75 12C2.75 10.3764 2.75047 9.14244 2.82395 8.15274C2.85601 7.72084 2.90131 7.34885 2.96271 7.02337L4.43917 8.49983C6.07144 10.1321 7.35062 11.4113 8.48288 12.2752C9.64181 13.1594 10.7345 13.6789 12 13.6789C13.2655 13.6789 14.3582 13.1594 15.5171 12.2752C16.6494 11.4113 17.9285 10.1321 19.5608 8.49986L21.0373 7.02337Z" clipRule="evenodd"></path>
                                            </svg>
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
                        <h2 className="card-heading"><Icon icon="mdi:certificate-outline" width={30} />Academic Information</h2>
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
                            {viewedProfile?.skills?.map((skill, index) => (
                                <div key={index} className="skill-card">
                                    <Icon
                                        icon={getSkillIcon(skill)}
                                        width={50}
                                        height={50}
                                    />
                                    <span>{skill}</span>
                                </div>
                            ))}
                        </div>


                    </div>

                    <div className="clubs-card">
                        <h2 className="skillscard-heading"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users w-5 h-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle></svg>
                            Clubs</h2>
                        <div className="card-container">
                            <div className="skill-card">Card1</div>
                        </div>
                    </div>

                    <div className="achievements-card">
                        <h2 className="skillscard-heading"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 16 16" id="trophy">
                            <path fill="#212121" d="M4 3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3H12.5C13.3284 3 14 3.67157 14 4.5V5.5C14 6.751 13.0806 7.78705 11.8813 7.97098C11.4867 9.55371 10.1493 10.7634 8.50003 10.969V12H10C11.1046 12 12 12.8954 12 14V14.5035C12 14.7796 11.7761 15.0035 11.5 15.0035H4.5C4.22386 15.0035 4 14.7796 4 14.5035V14C4 12.8954 4.89543 12 6 12H7.50003V10.9691C5.85083 10.7634 4.51341 9.55379 4.1187 7.97111C2.91915 7.78758 1.99707 6.75188 1.99707 5.5V4.5C1.99707 3.67157 2.66864 3 3.49707 3L4 3ZM11 3C11 2.44772 10.5523 2 10 2H6C5.44772 2 5 2.44772 5 3V7C5 8.65685 6.34315 10 8 10C9.63359 10 10.9622 8.69431 10.9992 7.0696L11 3ZM12 6.91441C12.5826 6.70826 13 6.15268 13 5.5V4.5C13 4.22386 12.7761 4 12.5 4H12V6.91441ZM4 4H3.49707C3.22093 4 2.99707 4.22386 2.99707 4.5V5.5C2.99707 6.15262 3.41604 6.70886 4 6.9148V4ZM5 14V14.0035H11V14C11 13.4477 10.5523 13 10 13H6C5.44772 13 5 13.4477 5 14Z"></path>
                        </svg>
                            Achievements</h2>
                        <div className="card-container">
                            <div className="skill-card">Card1</div>
                        </div>
                    </div>


                </div>
            </main >
        </div >
    )
}

export default Userprofile
