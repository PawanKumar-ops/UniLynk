"use client"

import { useState } from 'react';
import './NewClubForm.css';

export default function JoinAsClub() {
    const [formData, setFormData] = useState({
        clubName: '',
        profilePic: null,
        bannerImage: null,
        genre: '',
        about: '',
        activities: ['', '', '', ''],
        leadershipTeam: [{ name: '', position: '', photo: null }],
        pastActivities: [{ title: '', description: '', date: '', image: null }]
    });

    const [profilePicPreview, setProfilePicPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'profilePic') {
                    setProfilePicPreview(reader.result);
                    setFormData(prev => ({ ...prev, profilePic: file }));
                } else if (field === 'bannerImage') {
                    setBannerPreview(reader.result);
                    setFormData(prev => ({ ...prev, bannerImage: file }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleActivityChange = (index, value) => {
        const newActivities = [...formData.activities];
        newActivities[index] = value;
        setFormData(prev => ({ ...prev, activities: newActivities }));
    };

    const handleLeadershipChange = (index, field, value) => {
        const newLeadership = [...formData.leadershipTeam];
        newLeadership[index] = { ...newLeadership[index], [field]: value };
        setFormData(prev => ({ ...prev, leadershipTeam: newLeadership }));
    };

    const handleLeadershipPhotoChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newLeadership = [...formData.leadershipTeam];
            newLeadership[index] = { ...newLeadership[index], photo: file };
            setFormData(prev => ({ ...prev, leadershipTeam: newLeadership }));
        }
    };

    const addLeadershipMember = () => {
        setFormData(prev => ({
            ...prev,
            leadershipTeam: [...prev.leadershipTeam, { name: '', position: '', photo: null }]
        }));
    };

    const removeLeadershipMember = (index) => {
        if (formData.leadershipTeam.length > 1) {
            const newLeadership = formData.leadershipTeam.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, leadershipTeam: newLeadership }));
        }
    };

    const handlePastActivityChange = (index, field, value) => {
        const newPastActivities = [...formData.pastActivities];
        newPastActivities[index] = { ...newPastActivities[index], [field]: value };
        setFormData(prev => ({ ...prev, pastActivities: newPastActivities }));
    };

    const handlePastActivityImageChange = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const newPastActivities = [...formData.pastActivities];
            newPastActivities[index] = { ...newPastActivities[index], image: file };
            setFormData(prev => ({ ...prev, pastActivities: newPastActivities }));
        }
    };

    const addPastActivity = () => {
        setFormData(prev => ({
            ...prev,
            pastActivities: [...prev.pastActivities, { title: '', description: '', date: '', image: null }]
        }));
    };

    const removePastActivity = (index) => {
        if (formData.pastActivities.length > 1) {
            const newPastActivities = formData.pastActivities.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, pastActivities: newPastActivities }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        alert('Club registration submitted successfully!');
    };

    const steps = [
        { number: 1, title: 'Basic Info', fields: ['clubName', 'genre'] },
        { number: 2, title: 'Visual Identity', fields: ['profilePic', 'bannerImage'] },
        { number: 3, title: 'About & Activities', fields: ['about', 'activities'] },
        { number: 4, title: 'Team & History', fields: ['leadershipTeam', 'pastActivities'] }
    ];

    return (
        <div className="join-club-container">
            


                {/* Main Content */}
                <main className="main-content">
                    <div className="content-wrapper">
                        <header className="page-header">
                            <h1>Create Your Club Profile</h1>
                            <p>Complete the information below to register your club and join our community</p>
                        </header>

                        <form onSubmit={handleSubmit} className="registration-form">
                            {/* Section 1: Basic Information */}
                            <div className="form-section">
                                <div className="section-header">
                                    <div className="section-number">01</div>
                                    <div className="section-info">
                                        <h3>Basic Information</h3>
                                        <p>Tell us about your club's identity</p>
                                    </div>
                                </div>

                                <div className="section-content">
                                    <div className="input-group">
                                        <label htmlFor="clubName">
                                            Club Name <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="clubName"
                                            name="clubName"
                                            value={formData.clubName}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Tech Innovators Club"
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label htmlFor="genre">
                                            Club Category <span className="required">*</span>
                                        </label>
                                        <div className="select-wrapper">
                                            <select
                                                id="genre"
                                                name="genre"
                                                value={formData.genre}
                                                onChange={handleInputChange}
                                                className="input-field select-field"
                                                required
                                            >
                                                <option value="">Choose a category</option>
                                                <option value="technology">Technology</option>
                                                <option value="arts">Arts & Culture</option>
                                                <option value="sports">Sports & Fitness</option>
                                                <option value="music">Music</option>
                                                <option value="dance">Dance</option>
                                                <option value="literature">Literature</option>
                                                <option value="science">Science</option>
                                                <option value="social">Social Service</option>
                                                <option value="business">Business & Entrepreneurship</option>
                                                <option value="photography">Photography</option>
                                                <option value="gaming">Gaming</option>
                                                <option value="environmental">Environmental</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Visual Identity */}
                            <div className="form-section">
                                <div className="section-header">
                                    <div className="section-number">02</div>
                                    <div className="section-info">
                                        <h3>Visual Identity</h3>
                                        <p>Upload your club's logo and banner</p>
                                    </div>
                                </div>

                                <div className="section-content">
                                    <div className="upload-grid">
                                        <div className="upload-box">
                                            <label className="upload-label">
                                                Club Logo <span className="required">*</span>
                                            </label>
                                            {profilePicPreview ? (
                                                <div className="preview-wrapper logo-preview">
                                                    <img src={profilePicPreview} alt="Logo preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProfilePicPreview(null);
                                                            setFormData(prev => ({ ...prev, profilePic: null }));
                                                        }}
                                                        className="preview-remove"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label htmlFor="profilePic" className="upload-area logo-upload">
                                                    <div className="upload-placeholder">
                                                        <div className="upload-icon-wrapper">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                                                <path d="M3 15L8 10L12 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M11 13L14 10L21 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                        <span className="upload-title">Upload Logo</span>
                                                        <span className="upload-subtitle">PNG, JPG (Max 5MB)</span>
                                                    </div>
                                                </label>
                                            )}
                                            <input
                                                type="file"
                                                id="profilePic"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'profilePic')}
                                                className="file-input-hidden"
                                                required
                                            />
                                        </div>

                                        <div className="upload-box banner-box">
                                            <label className="upload-label">
                                                Banner Image <span className="required">*</span>
                                            </label>
                                            {bannerPreview ? (
                                                <div className="preview-wrapper banner-preview">
                                                    <img src={bannerPreview} alt="Banner preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setBannerPreview(null);
                                                            setFormData(prev => ({ ...prev, bannerImage: null }));
                                                        }}
                                                        className="preview-remove"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <label htmlFor="bannerImage" className="upload-area banner-upload">
                                                    <div className="upload-placeholder">
                                                        <div className="upload-icon-wrapper">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
                                                                <path d="M2 13L7 8L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M10 11L13 8L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                        <span className="upload-title">Upload Banner</span>
                                                        <span className="upload-subtitle">1920x400px recommended</span>
                                                    </div>
                                                </label>
                                            )}
                                            <input
                                                type="file"
                                                id="bannerImage"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'bannerImage')}
                                                className="file-input-hidden"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: About & Activities */}
                            <div className="form-section">
                                <div className="section-header">
                                    <div className="section-number">03</div>
                                    <div className="section-info">
                                        <h3>About & Activities</h3>
                                        <p>Describe your club's mission and key activities</p>
                                    </div>
                                </div>

                                <div className="section-content">
                                    <div className="input-group">
                                        <label htmlFor="about">
                                            About Your Club <span className="required">*</span>
                                        </label>
                                        <textarea
                                            id="about"
                                            name="about"
                                            value={formData.about}
                                            onChange={handleInputChange}
                                            placeholder="Share your club's story, mission, and what makes it unique..."
                                            className="input-field textarea-field"
                                            rows="5"
                                            required
                                        />
                                        <div className="field-hint">{formData.about.length} / 500 characters</div>
                                    </div>

                                    <div className="input-group">
                                        <label>
                                            Key Activities <span className="required">*</span>
                                        </label>
                                        <div className="field-hint">List 2-4 main activities your club offers</div>
                                        <div className="activities-list">
                                            {formData.activities.map((activity, index) => (
                                                <div key={index} className="activity-row">
                                                    <span className="activity-badge">{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={activity}
                                                        onChange={(e) => handleActivityChange(index, e.target.value)}
                                                        placeholder={`Activity ${index + 1}`}
                                                        className="input-field activity-field"
                                                        required={index < 2}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Leadership Team */}
                            <div className="form-section">
                                <div className="section-header">
                                    <div className="section-number">04</div>
                                    <div className="section-info">
                                        <h3>Leadership Team</h3>
                                        <p>Introduce your club's leadership members</p>
                                    </div>
                                </div>

                                <div className="section-content">
                                    <div className="team-grid">
                                        {formData.leadershipTeam.map((member, index) => (
                                            <div key={index} className="team-card">
                                                <div className="team-card-header">
                                                    <span className="team-badge">Member {index + 1}</span>
                                                    {formData.leadershipTeam.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeLeadershipMember(index)}
                                                            className="remove-button"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="team-fields">
                                                    <div className="input-group compact">
                                                        <label>Name</label>
                                                        <input
                                                            type="text"
                                                            value={member.name}
                                                            onChange={(e) => handleLeadershipChange(index, 'name', e.target.value)}
                                                            placeholder="Full name"
                                                            className="input-field"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="input-group compact">
                                                        <label>Position</label>
                                                        <input
                                                            type="text"
                                                            value={member.position}
                                                            onChange={(e) => handleLeadershipChange(index, 'position', e.target.value)}
                                                            placeholder="e.g., President"
                                                            className="input-field"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="input-group compact">
                                                        <label>Photo</label>
                                                        <label htmlFor={`leader-photo-${index}`} className="file-upload-btn">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M14 10V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                <path d="M11 5L8 2L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M8 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                            {member.photo ? 'Photo uploaded' : 'Upload photo'}
                                                        </label>
                                                        <input
                                                            type="file"
                                                            id={`leader-photo-${index}`}
                                                            accept="image/*"
                                                            onChange={(e) => handleLeadershipPhotoChange(index, e)}
                                                            className="file-input-hidden"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={addLeadershipMember} className="add-more-btn">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Add Team Member
                                    </button>
                                </div>
                            </div>

                            {/* Section 5: Past Activities */}
                            <div className="form-section">
                                <div className="section-header">
                                    <div className="section-number">05</div>
                                    <div className="section-info">
                                        <h3>Past Activities</h3>
                                        <p>Showcase your club's previous events <span className="optional-text">(Optional)</span></p>
                                    </div>
                                </div>

                                <div className="section-content">
                                    <div className="history-list">
                                        {formData.pastActivities.map((activity, index) => (
                                            <div key={index} className="history-card">
                                                <div className="history-header">
                                                    <span className="history-number">#{index + 1}</span>
                                                    {formData.pastActivities.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePastActivity(index)}
                                                            className="remove-button"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="history-fields">
                                                    <div className="field-row">
                                                        <div className="input-group compact">
                                                            <label>Activity Title</label>
                                                            <input
                                                                type="text"
                                                                value={activity.title}
                                                                onChange={(e) => handlePastActivityChange(index, 'title', e.target.value)}
                                                                placeholder="e.g., Annual Tech Summit"
                                                                className="input-field"
                                                            />
                                                        </div>
                                                        <div className="input-group compact">
                                                            <label>Date</label>
                                                            <input
                                                                type="date"
                                                                value={activity.date}
                                                                onChange={(e) => handlePastActivityChange(index, 'date', e.target.value)}
                                                                className="input-field"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="input-group compact">
                                                        <label>Description</label>
                                                        <textarea
                                                            value={activity.description}
                                                            onChange={(e) => handlePastActivityChange(index, 'description', e.target.value)}
                                                            placeholder="Brief description of the activity..."
                                                            className="input-field textarea-field"
                                                            rows="3"
                                                        />
                                                    </div>
                                                    <div className="input-group compact">
                                                        <label>Activity Photo</label>
                                                        <label htmlFor={`past-activity-${index}`} className="file-upload-btn">
                                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                                <path d="M14 10V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                                <path d="M11 5L8 2L5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                                <path d="M8 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                            </svg>
                                                            {activity.image ? 'Photo uploaded' : 'Upload photo'}
                                                        </label>
                                                        <input
                                                            type="file"
                                                            id={`past-activity-${index}`}
                                                            accept="image/*"
                                                            onChange={(e) => handlePastActivityImageChange(index, e)}
                                                            className="file-input-hidden"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={addPastActivity} className="add-more-btn secondary">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                        Add Another Activity
                                    </button>
                                </div>
                            </div>

                            {/* Submit Section */}
                            <div className="submit-section">
                                <div className="submit-info">
                                    <h4>Ready to Submit?</h4>
                                    <p>Please review all information before submitting your registration</p>
                                </div>
                                <div className="submit-actions">
                                    <button type="button" className="btn-cancel">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Submit Registration
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M3.75 9H14.25M14.25 9L9 3.75M14.25 9L9 14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </main>
            
        </div>
    );
}
