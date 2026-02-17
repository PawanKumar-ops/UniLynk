"use client";

import { useState, useRef, useEffect } from "react";
import "./ProfileEditModal.css";
import { SOCIAL_ICONS, SOCIAL_PLACEHOLDERS } from "@/lib/socialIcons";
import { Plus } from "lucide-react";


const ProfileEditModal = ({ onClose }) => {

    const [socials, setSocials] = useState([
        { id: "1", platform: "LinkedIn", url: "linkedin.com/in/krishna" },
        { id: "2", platform: "GitHub", url: "github.com/krishna" },
    ]);

    const [activeTab, setActiveTab] = useState("profile");
    const [profileImage, setProfileImage] = useState(
        "https://akm-img-a-in.tosshub.com/sites/dailyo/story/embed/201809/painting_of_lord_kri_090118090030.jpg"
    );
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    /* ================= SOCIALS ================= */
    const [newSocialPlatform, setNewSocialPlatform] = useState("LinkedIn");
    const [newSocialUrl, setNewSocialUrl] = useState("");

    /* ================= SKILLS ================= */
    const [skills, setSkills] = useState([
        { id: "1", name: "React" },
        { id: "2", name: "TypeScript" },
        { id: "3", name: "Node.js" },
        { id: "4", name: "UI/UX Design" },
        { id: "5", name: "Python" },
    ]);
    const [newSkill, setNewSkill] = useState("");

    /* ================= ACHIEVEMENTS ================= */
    const [achievements, setAchievements] = useState([
        {
            id: "1",
            title: "Tech Innovation Hackathon Winner",
            description:
                "Led a team of 4 to develop an AI-powered study assistant. Won first place among 50+ teams.",
            date: "January 2026",
        },
        {
            id: "2",
            title: "Dean's List - Academic Excellence",
            description:
                "Achieved GPA of 3.9/4.0 for exceptional academic performance.",
            date: "Fall 2024",
        },
    ]);
    const [newAchievement, setNewAchievement] = useState({
        title: "",
        description: "",
        date: "",
    });

    /* ================= PROFILE ================= */
    const [profileData, setProfileData] = useState({
        name: "Krishna",
        major: "Computer Science",
        year: "Class of 2026",
        email: "74863952@nitkkr.ac.in",
    });

    // =========================== UseEffects===================

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "unset";
        };
    }, []);


    /* ================= IMAGE ================= */
    const handleImageUpload = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        const reader = new FileReader();
        reader.onloadend = () => setProfileImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleImageUpload(e.dataTransfer.files[0]);
    };

    /* ================= SOCIALS ================= */
    const addSocial = () => {
        if (!newSocialUrl.trim()) return;

        setSocials((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                platform: newSocialPlatform,
                url: newSocialUrl.trim(),
            },
        ]);

        setNewSocialUrl("");
    };


    const removeSocial = (id) =>
        setSocials(socials.filter(s => s.id !== id));

    /* ================= SKILLS ================= */
    const addSkill = () => {
        if (!newSkill.trim() || skills.length >= 15) return;
        setSkills([
            ...skills,
            { id: Date.now().toString(), name: newSkill.trim() },
        ]);
        setNewSkill("");
    };

    const removeSkill = (id) =>
        setSkills(skills.filter(s => s.id !== id));

    /* ================= ACHIEVEMENTS ================= */
    const addAchievement = () => {
        if (!newAchievement.title || !newAchievement.description) return;
        setAchievements([
            ...achievements,
            { id: Date.now().toString(), ...newAchievement },
        ]);
        setNewAchievement({ title: "", description: "", date: "" });
    };

    const removeAchievement = (id) =>
        setAchievements(achievements.filter(a => a.id !== id));

    const handleSave = () => {
        console.log({
            profileData,
            profileImage,
            socials,
            skills,
            achievements,
        });
        onClose()
    };


    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };


    return (
        <div
            className="modal-overlay"
            onClick={onClose}
        >
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">Edit Profile</h2>
                        <p className="modal-subtitle">
                            Update your information to stand out
                        </p>
                    </div>
                    <button
                        className="close-button"
                        onClick={onClose}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                        >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="tab-navigation">
                    <button
                        className={`tab-button ${activeTab === "profile" ? "active" : ""}`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Profile
                    </button>
                    <button
                        className={`tab-button ${activeTab === "socials" ? "active" : ""}`}
                        onClick={() => setActiveTab("socials")}
                    >
                        Social Media
                    </button>
                    <button
                        className={`tab-button ${activeTab === "skills" ? "active" : ""}`}
                        onClick={() => setActiveTab("skills")}
                    >
                        Skills
                    </button>
                    <button
                        className={`tab-button ${activeTab === "achievements" ? "active" : ""}`}
                        onClick={() => setActiveTab("achievements")}
                    >
                        Achievements
                    </button>
                </div>

                {/* Modal Content */}
                <div className="modal-content">
                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="tab-content">
                            <div className="section">
                                <h3 className="section-title">
                                    Profile Picture
                                </h3>
                                <div className="profile-image-section">
                                    <div className="profile-image-preview">
                                        <img
                                            src={profileImage}
                                            alt="Profile"
                                            className="profile-image"
                                        />
                                    </div>
                                    <div className="profile-image-actions">
                                        <div
                                            className={`image-dropzone ${isDragging ? "dragging" : ""}`}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                        >
                                            <svg
                                                width="40"
                                                height="40"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                            >
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line
                                                    x1="12"
                                                    y1="3"
                                                    x2="12"
                                                    y2="15"
                                                ></line>
                                            </svg>
                                            <p className="dropzone-text">
                                                {isDragging
                                                    ? "Drop image here"
                                                    : "Click or drag image to upload"}
                                            </p>
                                            <p className="dropzone-hint">
                                                PNG, JPG up to 5MB
                                            </p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInputChange}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="section">
                                <h3 className="section-title">
                                    Basic Information
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={profileData.name}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    name: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={profileData.email}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    email: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Major</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={profileData.major}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    major: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Graduation Year
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={profileData.year}
                                            onChange={(e) =>
                                                setProfileData({
                                                    ...profileData,
                                                    year: e.target.value,
                                                })
                                            }
                                        />
                                    </div>

                                </div>

                            </div>
                        </div>
                    )}

                    {/* Social Media Tab */}
                    {activeTab === "socials" && (
                        <div className="tab-content">
                            <div className="section">
                                <h3 className="section-title">
                                    Your Social Profiles
                                </h3>
                                <p className="section-description">
                                    Connect your social media accounts to let
                                    others find and follow you
                                </p>

                                <div className="social-list">
                                    {socials.map((social) => (
                                        <div
                                            key={social.id}
                                            className="social-item"
                                        >
                                            <div className="social-icon">
                                                <img
                                                    src={SOCIAL_ICONS[social.platform]}
                                                    alt={social.platform}
                                                    className="social-icon-img"
                                                />
                                            </div>
                                            <div className="social-info">
                                                <p className="social-platform">
                                                    {social.platform}
                                                </p>
                                                <p className="social-url">
                                                    {social.url}
                                                </p>
                                            </div>
                                            <button
                                                className="delete-button"
                                                onClick={() => removeSocial(social.id)}
                                            >
                                                <svg
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="add-social-form">
                                    <select
                                        className="form-select"
                                        value={newSocialPlatform}
                                        onChange={(e) => setNewSocialPlatform(e.target.value)}
                                    >
                                        {Object.keys(SOCIAL_ICONS).map((platform) => (
                                            <option key={platform} value={platform}>
                                                {platform}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={SOCIAL_PLACEHOLDERS[newSocialPlatform]}
                                        value={newSocialUrl}
                                        onChange={(e) => setNewSocialUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addSocial()}
                                    />

                                    <button
                                        className="add-button"
                                        onClick={addSocial}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <line
                                                x1="12"
                                                y1="5"
                                                x2="12"
                                                y2="19"
                                            ></line>
                                            <line
                                                x1="5"
                                                y1="12"
                                                x2="19"
                                                y2="12"
                                            ></line>
                                        </svg>
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Skills Tab */}
                    {activeTab === "skills" && (
                        <div className="tab-content">
                            <div className="section">
                                <h3 className="section-title">Your Skills</h3>
                                <p className="section-description">
                                    Add up to 15 skills that showcase your
                                    expertise ({skills.length}/15)
                                </p>

                                <div className="skills-grid">
                                    {skills.map((skill) => (
                                        <div key={skill.id} className="skill-tag">
                                            <span>{skill.name}</span>
                                            <button
                                                className="skill-remove"
                                                onClick={() => removeSkill(skill.id)}
                                            >
                                                <svg
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <line
                                                        x1="18"
                                                        y1="6"
                                                        x2="6"
                                                        y2="18"
                                                    ></line>
                                                    <line
                                                        x1="6"
                                                        y1="6"
                                                        x2="18"
                                                        y2="18"
                                                    ></line>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="add-skill-form">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter a skill (e.g., React, Python, Leadership)"
                                        value={newSkill}
                                        onChange={(e) =>
                                            setNewSkill(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === "Enter" && addSkill()
                                        }
                                        disabled={skills.length >= 15}
                                    />
                                    <button
                                        className="add-button"
                                        onClick={addSkill}
                                        disabled={skills.length >= 15}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <line
                                                x1="12"
                                                y1="5"
                                                x2="12"
                                                y2="19"
                                            ></line>
                                            <line
                                                x1="5"
                                                y1="12"
                                                x2="19"
                                                y2="12"
                                            ></line>
                                        </svg>
                                        Add Skill
                                    </button>
                                </div>
                            </div>

                            <div className="section">
                                <h3 className="section-title">
                                    Suggested Skills
                                </h3>
                                <div className="suggested-skills">
                                    {[
                                        "JavaScript",
                                        "Leadership",
                                        "Communication",
                                        "Project Management",
                                        "Data Analysis",
                                    ].map((skill) => (
                                        <button
                                            key={skill}
                                            className="suggested-skill"
                                            onClick={() => {
                                                if (
                                                    !skills.find(
                                                        (s) => s.name === skill,
                                                    ) &&
                                                    skills.length < 15
                                                ) {
                                                    setSkills([
                                                        ...skills,
                                                        {
                                                            id: Date.now().toString(),
                                                            name: skill,
                                                        },
                                                    ]);
                                                }
                                            }}
                                        >
                                            <Plus /> {skill}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Achievements Tab */}
                    {activeTab === "achievements" && (
                        <div className="tab-content">
                            <div className="section">
                                <h3 className="section-title">
                                    Your Achievements
                                </h3>
                                <p className="section-description">
                                    Showcase your accomplishments and milestones
                                </p>

                                <div className="achievements-list">
                                    {achievements.map((achievement) => (
                                        <div
                                            key={achievement.id}
                                            className="achievement-card"
                                        >
                                            <div className="achievement-header">
                                                <div className="achievement-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none" viewBox="0 0 16 16" id="trophy"><path fill="#212121" d="M4 3C4 1.89543 4.89543 1 6 1H10C11.1046 1 12 1.89543 12 3H12.5C13.3284 3 14 3.67157 14 4.5V5.5C14 6.751 13.0806 7.78705 11.8813 7.97098C11.4867 9.55371 10.1493 10.7634 8.50003 10.969V12H10C11.1046 12 12 12.8954 12 14V14.5035C12 14.7796 11.7761 15.0035 11.5 15.0035H4.5C4.22386 15.0035 4 14.7796 4 14.5035V14C4 12.8954 4.89543 12 6 12H7.50003V10.9691C5.85083 10.7634 4.51341 9.55379 4.1187 7.97111C2.91915 7.78758 1.99707 6.75188 1.99707 5.5V4.5C1.99707 3.67157 2.66864 3 3.49707 3L4 3ZM11 3C11 2.44772 10.5523 2 10 2H6C5.44772 2 5 2.44772 5 3V7C5 8.65685 6.34315 10 8 10C9.63359 10 10.9622 8.69431 10.9992 7.0696L11 3ZM12 6.91441C12.5826 6.70826 13 6.15268 13 5.5V4.5C13 4.22386 12.7761 4 12.5 4H12V6.91441ZM4 4H3.49707C3.22093 4 2.99707 4.22386 2.99707 4.5V5.5C2.99707 6.15262 3.41604 6.70886 4 6.9148V4ZM5 14V14.0035H11V14C11 13.4477 10.5523 13 10 13H6C5.44772 13 5 13.4477 5 14Z"></path></svg>
                                                </div>
                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        removeAchievement(achievement.id)
                                                    }
                                                >
                                                    <svg
                                                        width="18"
                                                        height="18"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                    >
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                            <h4 className="achievement-title">
                                                {achievement.title}
                                            </h4>
                                            <p className="achievement-description">
                                                {achievement.description}
                                            </p>
                                            {achievement.date && (
                                                <p className="achievement-date">
                                                    {achievement.date}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="add-achievement-form">
                                    <div className="form-group">
                                        <label className="form-label">
                                            Achievement Title
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., Hackathon Winner, Published Research"
                                            value={newAchievement.title}
                                            onChange={(e) =>
                                                setNewAchievement({
                                                    ...newAchievement,
                                                    title: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Description
                                        </label>
                                        <textarea
                                            className="form-textarea"
                                            rows={3}
                                            placeholder="Describe your achievement..."
                                            value={newAchievement.description}
                                            onChange={(e) =>
                                                setNewAchievement({
                                                    ...newAchievement,
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">
                                            Date (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., January 2026"
                                            value={newAchievement.date}
                                            onChange={(e) =>
                                                setNewAchievement({
                                                    ...newAchievement,
                                                    date: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <button
                                        className="add-button-full"
                                        onClick={addAchievement}
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <line
                                                x1="12"
                                                y1="5"
                                                x2="12"
                                                y2="19"
                                            ></line>
                                            <line
                                                x1="5"
                                                y1="12"
                                                x2="19"
                                                y2="12"
                                            ></line>
                                        </svg>
                                        Add Achievement
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <button
                        className="cancel-button"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button className="save-button" onClick={handleSave}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;