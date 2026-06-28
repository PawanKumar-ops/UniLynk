"use client"

import React, { Suspense } from 'react'
import "./userprofile.css"
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useMemo } from 'react';
import { Icon } from "@iconify/react";
import { getSkillIcon } from "@/lib/skillIcons";
import ProfileEditModal from '@/components/ProfileEditModal'
import { PostsModal } from '@/components/PostsModal'
import ReliableImage from '@/components/ReliableImage'
import { SOCIAL_ICONS } from '@/lib/socialIcons'

const Userprofile = () => {
    const [clubpostsModalOpen, setClubPostsModalOpen] = useState(false);
    const [modalPosts, setModalPosts] = useState([]);
    const [modalTitle, setModalTitle] = useState('');


    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const routeUserId = useMemo(() => {
        const byQuery = searchParams.get('userId');
        if (byQuery) return byQuery;
        const match = pathname?.match(/\/dashboard\/search\/id=(.+)$/);
        return match ? decodeURIComponent(match[1]) : null;
    }, [searchParams, pathname]);
    const [sessionUser, setSessionUser] = useState(null);
    const [viewedProfile, setViewedProfile] = useState(null);
    const [showEditProfileModal, setEditProfileModal] = useState(false)
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileClubs, setProfileClubs] = useState([]);
    const [clubsLoading, setClubsLoading] = useState(false);
    const [clubsError, setClubsError] = useState("");
    const [error, setError] = useState("");

    const fetchPosts = async (savedOnly = false) => {
        try {
            const res = await fetch('/api/posts?audience=for-you');
            const data = await res.json();
            const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
            const profileEmail = normalizeEmail(viewedProfile?.email || sessionUser?.email);
            const profileName = (viewedProfile?.name || sessionUser?.name || '').trim().toLowerCase();
            let posts = Array.isArray(data.posts) ? data.posts : [];

            if (savedOnly) {
                posts = posts.filter((post) => post.savedByCurrentUser);
                setModalTitle('Saved Posts');
            } else {
                posts = posts.filter((post) => {
                    const authorEmail = normalizeEmail(post.authorEmail);
                    const authorName = (post.authorName || '').trim().toLowerCase();

                    return (profileEmail && authorEmail === profileEmail) || (profileName && authorName === profileName);
                });
                setModalTitle('My Posts');
            }

            setModalPosts(posts);
            setClubPostsModalOpen(true);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        }
    };

    const handleOpenPosts = () => fetchPosts(false);
    const handleOpenSaved = () => fetchPosts(true);
    const YEAR_OFFSET = {
        "First Year": 0,
        "Second Year": 1,
        "Third Year": 2,
        "Fourth Year": 3,
        "Fifth Year": 4,
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

                if (routeUserId) {
                    const profileRes = await fetch(`/api/users/${routeUserId}`, { cache: 'no-store' });
                    const profileData = await profileRes.json();
                    if (!profileRes.ok) throw new Error(profileData.message);
                    setViewedProfile(profileData.user);
                } else {
                    setViewedProfile(data.user);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setProfileLoading(false);
            }
        };

        getUserProfile();
    }, [status, routeUserId]);


    useEffect(() => {
        if (status !== "authenticated" || !viewedProfile?._id) return;

        const fetchProfileClubs = async () => {
            try {
                setClubsLoading(true);
                setClubsError("");

                const res = await fetch(`/api/users/${viewedProfile._id}/clubs`, { cache: "no-store" });
                const data = await res.json();

                if (!res.ok) throw new Error(data?.message || "Failed to fetch clubs");

                setProfileClubs(Array.isArray(data?.clubs) ? data.clubs : []);
            } catch (err) {
                console.error("Failed to fetch profile clubs", err);
                setProfileClubs([]);
                setClubsError(err.message || "Failed to fetch clubs");
            } finally {
                setClubsLoading(false);
            }
        };

        fetchProfileClubs();
    }, [status, viewedProfile?._id]);

    const isOwnProfile = useMemo(() => {
        if (!sessionUser || !viewedProfile) return false;
        return sessionUser._id === viewedProfile._id;
    }, [sessionUser, viewedProfile]);

    const handleProfileUpdated = (updatedUser) => {
        setSessionUser(updatedUser);
        setViewedProfile((prev) => {
            if (!prev || prev._id === updatedUser._id) {
                return updatedUser;
            }
            return prev;
        });
    };

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

    const normalizeSocialUrl = (url) => {
        if (!url) return "#";
        if (url.startsWith("http://") || url.startsWith("https://")) return url;
        return `https://${url}`;
    };

    const userSocials = useMemo(() => {
        return (viewedProfile?.socials || []).filter(
            (social) => social?.platform && social?.url,
        );
    }, [viewedProfile]);



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
        return <div className="user-profile-page">
            <div className="user-profile-errorpage">
                <Image src="/Userprofile/Userprofileerrorpage.svg" alt='Error in page' width={338.767} height={350} />
                <h1 className="user-profile-error-msg">{error}</h1>
            </div>
        </div>;
    }

    return (
        <div className="up-app-container">

            {/* Main Content Area */}
            <main className="up-main-area">
                {/* Top Bar */}
                <header className="up-userprofile-top-bar up-top-back-btn">
                    {!isOwnProfile && (
                        <button
                            className="icon-btn up-top-nav-btn back-btn-left"
                            type="button"
                            onClick={() => router.back()}
                            aria-label="Go back"
                        >
                            <Icon icon="mdi:arrow-left" width={22} />
                        </button>
                    )}

                    {isOwnProfile && (
                        <div className="up-top-profile-actions">
                            <button
                                className="icon-btn top-nav-btn"
                                type="button"
                                aria-label="My Posts"
                                onClick={handleOpenPosts}
                            >
                                <Icon icon="solar:posts-carousel-vertical-line-duotone" width={22} />
                                Posts
                            </button>

                            <button
                                className="icon-btn top-nav-btn"
                                type="button"
                                aria-label="Saved Posts"
                                onClick={handleOpenSaved}
                            >
                                <Icon icon="mage:bookmark" width={22} />
                                Saved
                            </button>
                        </div>
                    )}
                </header>

                {clubpostsModalOpen && (
                    <PostsModal
                        open={clubpostsModalOpen}
                        onOpenChange={setClubPostsModalOpen}
                        posts={modalPosts}
                        title={modalTitle}
                    />
                )}


                {/* Profile Content */}
                <div className="up-profile-content">
                    {/* Hero Section */}
                    <section className="hero-section">
                        <div className="hero-grid">
                            <div className="hero-left">
                                <div className="profile-image-wrapper">
                                    <ReliableImage
                                        className="profile-img"
                                        src={viewedProfile?.img}
                                        fallbackSrc="/Profilepic.png"
                                        alt={`${viewedProfile?.name || "User"} profile`}
                                        loading="eager"
                                        decoding="async"
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
                                            <ProfileEditModal
                                                user={sessionUser}
                                                onSave={handleProfileUpdated}
                                                onClose={() => setEditProfileModal(false)}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <button className="action-btn primary-btn" onClick={handleOpenPosts}>
                                            <Icon icon="solar:posts-carousel-vertical-line-duotone" width={22} />
                                            Posts
                                        </button>
                                        <button className="action-btn secondary-btn">
                                            <Icon icon="solar:letter-linear" />
                                            Message
                                        </button>
                                    </>
                                )}
                            </div>

                        </div>
                        <hr className='profilehr' />
                        <div className="social">
                            {userSocials.length > 0 ? userSocials.map((social) => (
                                <a
                                    key={`${social.platform}-${social.url}`}
                                    className='applogo'
                                    href={normalizeSocialUrl(social.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={social.platform}
                                >
                                    <img src={SOCIAL_ICONS[social.platform] || "/social/portfolio.svg"} alt={social.platform} />
                                    {userSocials.length === 1 && (
                                        <span className="social-platform-name">{social.platform}</span>
                                    )}
                                </a>
                            )) : (
                                <span style={{ color: "#6b7280" }}>No social links added</span>
                            )}
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
                        {clubsLoading && (
                            <div className="clubs-state">Loading clubs...</div>
                        )}

                        {!clubsLoading && clubsError && (
                            <div className="clubs-state clubs-state-error">{clubsError}</div>
                        )}

                        {!clubsLoading && !clubsError && profileClubs.length === 0 && (
                            <div className="clubs-empty-state">
                                <Icon icon="mdi:account-group-outline" width={42} />
                                <div>
                                    <h3>No clubs found</h3>
                                    <p>{isOwnProfile ? "Join or lead a club to see it here." : "This user is not part of any clubs yet."}</p>
                                </div>
                            </div>
                        )}

                        {!clubsLoading && !clubsError && profileClubs.length > 0 && (
                            <div className={`clubs-grid clubs-count-${Math.min(profileClubs.length, 3)}`}>
                                {profileClubs.map((club) => {
                                    const clubId = club._id || club.id;
                                    const clubName = club.clubName || club.name || "Campus Club";
                                    const memberCount = Number(club.memberCount) || 0;
                                    const leaderCount = Number(club.leaderCount) || 0;

                                    return (
                                        <article
                                            key={clubId || clubName}
                                            className="club-card"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => clubId && router.push(`/Club?clubId=${clubId}`)}
                                            onKeyDown={(event) => {
                                                if ((event.key === "Enter" || event.key === " ") && clubId) {
                                                    event.preventDefault();
                                                    router.push(`/Club?clubId=${clubId}`);
                                                }
                                            }}
                                            aria-label={`Open ${clubName} profile`}
                                        >
                                            <div
                                                className="club-banner"
                                                style={{ backgroundImage: `url(${club.banner || "/Background.jpg"})` }}
                                            >
                                                <div className="club-banner-overlay" />
                                                <span className="club-since-pill">
                                                    <Icon icon="mdi:calendar-blank-outline" width={13} />
                                                    Joined {club.joiningYear || "N/A"}
                                                </span>
                                            </div>

                                            <div className="club-body">
                                                <div className="club-avatar-wrap">
                                                    <ReliableImage
                                                        className="club-avatar"
                                                        src={club.logo}
                                                        fallbackSrc="/Defaultclublogo.svg"
                                                        alt={`${clubName} logo`}
                                                    />
                                                </div>

                                                <div className="club-info">
                                                    <div className="club-name-row">
                                                        <h3 className="club-name">{clubName}</h3>
                                                        <span className="club-verified" title="Verified club">
                                                            <Icon icon="mdi:check-decagram" width={18} />
                                                        </span>
                                                    </div>
                                                    <span className="club-position">
                                                        <Icon icon="mdi:shield-star-outline" width={14} />
                                                        {club.position || "Member"}
                                                    </span>
                                                </div>

                                                <div className="club-meta">
                                                    <div className="club-meta-item">
                                                        <span className="club-meta-value">{memberCount}</span>
                                                        <span className="club-meta-label">Members</span>
                                                    </div>
                                                    <div className="club-meta-item">
                                                        <span className="club-meta-value">{leaderCount}</span>
                                                        <span className="club-meta-label">Leaders</span>
                                                    </div>
                                                    <div className="club-meta-divider" />
                                                    <span className="club-visit-btn">
                                                        Visit
                                                        <Icon icon="mdi:arrow-top-right" width={16} />
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
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
        </div>
    )
}

export default function UserprofileWrapper() {
    return (
        <Suspense fallback={null}>
            <Userprofile />
        </Suspense>
    );
}
