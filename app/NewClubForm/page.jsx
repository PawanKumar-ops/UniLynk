"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './NewClubForm.css';

export default function Step1() {
    const router = useRouter();
    const [clubName, setClubName] = useState('');
    const [about, setAbout] = useState('');
    const [activities, setActivities] = useState(['', '']);
    const [members, setMembers] = useState([{ email: '', position: '' }]);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    const handleLogoUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const addActivity = () => {
        if (activities.length < 4) {
            setActivities([...activities, '']);
        }
    };

    const removeActivity = (index) => {
        if (activities.length > 2) {
            setActivities(activities.filter((_, i) => i !== index));
        }
    };

    const updateActivity = (index, value) => {
        const newActivities = [...activities];
        newActivities[index] = value;
        setActivities(newActivities);
    };

    const addMember = () => {
        setMembers([...members, { email: '', position: '' }]);
    };

    const removeMember = (index) => {
        if (members.length > 1) {
            setMembers(members.filter((_, i) => i !== index));
        }
    };

    const updateMember = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handleNext = () => {
        const formData = {
            clubName,
            about,
            activities,
            members,
            logoPreview,
            bannerPreview,
        };
        localStorage.setItem('step1Data', JSON.stringify(formData));
        router.push('/NewClubForm/Step2')
    };

    return (
        <div className="step-container">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo" onClick={() => router.push('/')}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <span className="logo-text">Unilynk</span>
                    </div>
                    <div className="step-indicator">Step 1 of 3</div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="progress-container">
                <div className="progress-bar" style={{ width: '33.33%' }}></div>
            </div>

            {/* Profile Preview */}
            <div className="profile-preview">
                {/* Banner Upload Area */}
                <label className="banner-upload-label">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="file-input"
                    />
                    <div className="banner-preview">
                        {bannerPreview ? (
                            <img src={bannerPreview} alt="Banner" className="banner-image" />
                        ) : (
                            <div className="banner-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <p className="banner-hint">Click to upload banner</p>
                            </div>
                        )}
                        <div className="banner-overlay">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                            <span className="overlay-text">Change Banner</span>
                        </div>
                    </div>
                </label>

                <div className="profile-info">
                    {/* Logo Upload Area */}
                    <label className="logo-upload-label">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="file-input"
                        />
                        <div className="logo-preview">
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="logo-image" />
                            ) : (
                                <div className="logo-placeholder">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="9" cy="7" r="4"></circle>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                    </svg>
                                </div>
                            )}
                            <div className="logo-overlay">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </div>
                        </div>
                    </label>

                    <div className="profile-actions">
                        <button className="action-button" type="button">Add Members</button>
                        <button className="action-button" type="button">Edit Profile</button>
                    </div>
                </div>
            </div>

            {/* Form */}
            <main className="form-content">
                <div className="form-header">
                    <h1 className="form-title">Club Information</h1>
                    <p className="form-description">Tell us about your club and what makes it special</p>
                </div>

                <div className="form-body">
                    {/* Club Name */}
                    <div className="form-group">
                        <label htmlFor="clubName" className="form-label">
                            Club Name *
                        </label>
                        <input
                            id="clubName"
                            type="text"
                            value={clubName}
                            onChange={(e) => setClubName(e.target.value)}
                            placeholder="Enter your club name"
                            className="form-input"
                        />
                    </div>

                    {/* About Club */}
                    <div className="form-group">
                        <label htmlFor="about" className="form-label">
                            About Club *
                        </label>
                        <textarea
                            id="about"
                            value={about}
                            onChange={(e) => setAbout(e.target.value)}
                            placeholder="Tell us about your club's mission, vision, and goals..."
                            className="form-textarea"
                            rows={4}
                        />
                    </div>

                    {/* What Your Club Does */}
                    <div className="form-group">
                        <label className="form-label">
                            What Your Club Does * (2-4 points)
                        </label>
                        <div className="list-group">
                            {activities.map((activity, index) => (
                                <div key={index} className="list-item">
                                    <input
                                        type="text"
                                        value={activity}
                                        onChange={(e) => updateActivity(index, e.target.value)}
                                        placeholder={`Activity ${index + 1}`}
                                        className="form-input"
                                    />
                                    {activities.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeActivity(index)}
                                            className="icon-button"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            {activities.length < 4 && (
                                <button
                                    type="button"
                                    onClick={addActivity}
                                    className="add-button"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                    Add Another Activity
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Leadership Team */}
                    <div className="form-group">
                        <label className="form-label">
                            Leadership Team *
                        </label>
                        <div className="list-group">
                            {members.map((member, index) => (
                                <div key={index} className="member-item">
                                    <div className="member-fields">
                                        <input
                                            type="email"
                                            value={member.email}
                                            onChange={(e) => updateMember(index, 'email', e.target.value)}
                                            placeholder="Email address"
                                            className="form-input"
                                        />
                                        <input
                                            type="text"
                                            value={member.position}
                                            onChange={(e) => updateMember(index, 'position', e.target.value)}
                                            placeholder="Position (e.g., President)"
                                            className="form-input"
                                        />
                                    </div>
                                    {members.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMember(index)}
                                            className="icon-button"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addMember}
                                className="add-button"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Another Member
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="form-footer">
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="button-outline"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="button-primary"
                    >
                        Continue to Past Activities
                    </button>
                </div>
            </main>
        </div>
    );
}
