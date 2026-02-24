"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./Step3.css";

export default function Step3() {
  const router = useRouter();

  const [activities, setActivities] = useState([
    {
      title: "",
      date: "",
      description: "",
      expectedParticipants: "",
    },
  ]);

  const addActivity = () => {
    setActivities([
      ...activities,
      {
        title: "",
        date: "",
        description: "",
        expectedParticipants: "",
      },
    ]);
  };

  const removeActivity = (index) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const updateActivity = (index, field, value) => {
    const newActivities = [...activities];
    newActivities[index][field] = value;
    setActivities(newActivities);
  };

  const handleSubmit = () => {
    localStorage.setItem("step3Data", JSON.stringify(activities));
    router.push("/NewClubForm/success");
  };

  const handleBack = () => {
    router.push("/NewClubForm/Step2");
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
          <div className="step-indicator">Step 3 of 3</div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: '100%' }}></div>
      </div>

      {/* Form */}
      <main className="form-content">
        <div className="form-header">
          <h1 className="form-title">Future Activities</h1>
          <p className="form-description">Share your club's upcoming plans and events</p>
        </div>

        <div className="form-body">
          {activities.map((activity, index) => (
            <div key={index} className="activity-card">
              <div className="activity-header">
                <h3 className="activity-title">Planned Activity {index + 1}</h3>
                {activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeActivity(index)}
                    className="remove-card-button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              <div className="activity-fields">
                <div className="form-group">
                  <label htmlFor={`title-${index}`} className="form-label">
                    Activity Title *
                  </label>
                  <input
                    id={`title-${index}`}
                    type="text"
                    value={activity.title}
                    onChange={(e) => updateActivity(index, 'title', e.target.value)}
                    placeholder="e.g., Spring Networking Summit"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`date-${index}`} className="form-label">
                    Planned Date *
                  </label>
                  <div className="input-with-icon">
                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <input
                      id={`date-${index}`}
                      type="date"
                      value={activity.date}
                      onChange={(e) => updateActivity(index, 'date', e.target.value)}
                      className="form-input with-icon"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor={`description-${index}`} className="form-label">
                    Description *
                  </label>
                  <textarea
                    id={`description-${index}`}
                    value={activity.description}
                    onChange={(e) => updateActivity(index, 'description', e.target.value)}
                    placeholder="Describe what this activity will include..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`participants-${index}`} className="form-label">
                    Expected Participants
                  </label>
                  <input
                    id={`participants-${index}`}
                    type="number"
                    value={activity.expectedParticipants}
                    onChange={(e) => updateActivity(index, 'expectedParticipants', e.target.value)}
                    placeholder="e.g., 200"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addActivity}
            className="add-activity-button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Another Future Activity
          </button>
        </div>

        {/* Navigation */}
        <div className="form-footer">
          <button
            type="button"
            onClick={handleBack}
            className="button-outline"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="button-primary"
          >
            Submit Application
          </button>
        </div>
      </main>
    </div>
  );
}
