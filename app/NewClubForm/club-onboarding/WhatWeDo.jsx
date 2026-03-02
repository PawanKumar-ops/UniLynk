"use client"

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import './WhatWeDo.css';

export default function WhatWeDo({ data, updateData, onNext, onBack }) {
  const [activities, setActivities] = useState(data.activities || []);
  const [currentActivity, setCurrentActivity] = useState({
    title: '',
    description: '',
    image: '',
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setCurrentActivity({ ...currentActivity, [name]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentActivity({ ...currentActivity, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addActivity = () => {
    if (currentActivity.title && currentActivity.description) {
      setActivities([...activities, currentActivity]);
      setCurrentActivity({ title: '', description: '', image: '' });
      setIsAdding(false);
    }
  };

  const removeActivity = (index) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    updateData({ activities });
    onNext();
  };

  return (
    <div className="step-form">
      <h2 className="step-title">What We Do</h2>
      <p className="step-description">
        Showcase your club's key activities and focus areas. Add at least one activity to help students understand what your club offers.
      </p>

      {activities.length > 0 && (
        <div className="activities-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-card">
              {activity.image && (
                <img src={activity.image} alt={activity.title} className="activity-image" />
              )}
              <div className="activity-content">
                <h3 className="activity-title">{activity.title}</h3>
                <p className="activity-description">{activity.description}</p>
              </div>
              <button
                className="btn-remove-activity"
                onClick={() => removeActivity(index)}
              >
                <Trash2/>
              </button>
            </div>
          ))}
        </div>
      )}

      {!isAdding && (
        <button
          className="btn-add-activity"
          onClick={() => setIsAdding(true)}
        >
          + Add Activity
        </button>
      )}

      {isAdding && (
        <div className="activity-form">
          <div className="form-group">
            <label className="form-label">Activity Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., Workshops & Hackathons"
              value={currentActivity.title}
              onChange={handleActivityChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe this activity..."
              value={currentActivity.description}
              onChange={handleActivityChange}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="activity-form-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setIsAdding(false);
                setCurrentActivity({ title: '', description: '', image: '' });
              }}
            >
              Cancel
            </button>
            <button
              className="btn-add"
              onClick={addActivity}
              disabled={!currentActivity.title || !currentActivity.description}
            >
              Add Activity
            </button>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-next"
          onClick={handleNext}
          disabled={activities.length === 0}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
