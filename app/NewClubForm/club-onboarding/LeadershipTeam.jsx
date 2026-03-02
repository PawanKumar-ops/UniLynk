"use client"

import { useState } from 'react';
import './LeadershipTeam.css';

export default function LeadershipTeam({ data, updateData, onNext, onBack }) {
  const [leaders, setLeaders] = useState(data.leaders || []);
  const [currentLeader, setCurrentLeader] = useState({
    name: '',
    position: '',
    image: '',
    bio: '',
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleLeaderChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeader({ ...currentLeader, [name]: value });
  };

  

  const addLeader = () => {
    if (currentLeader.name && currentLeader.position) {
      setLeaders([...leaders, currentLeader]);
      setCurrentLeader({ name: '', position: '', image: '', bio: '' });
      setIsAdding(false);
    }
  };

  const removeLeader = (index) => {
    setLeaders(leaders.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    updateData({ leaders });
    onNext();
  };

  return (
    <div className="step-form">
      <h2 className="step-title">Leadership Team</h2>
      <p className="step-description">
        Introduce your club's leadership team. Students love to know who they'll be working with!
      </p>

      {leaders.length > 0 && (
        <div className="leaders-grid">
          {leaders.map((leader, index) => (
            <div key={index} className="leader-card">
              <div className="leader-image-wrapper">
                {leader.image ? (
                  <img src={leader.image} alt={leader.name} className="leader-image" />
                ) : (
                  <div className="leader-placeholder">
                    {leader.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="leader-info">
                <h3 className="leader-name">{leader.name}</h3>
                <p className="leader-position">{leader.position}</p>
                {leader.bio && <p className="leader-bio">{leader.bio}</p>}
              </div>
              <button
                className="btn-remove-leader"
                onClick={() => removeLeader(index)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {!isAdding && (
        <button
          className="btn-add-leader"
          onClick={() => setIsAdding(true)}
        >
          + Add Team Member
        </button>
      )}

      {isAdding && (
        <div className="leader-form">
          

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student Email</label>
              <input
                type="name"
                name="name"
                className="form-input"
                placeholder="e.g., @nitkkr.ac.in"
                value={currentLeader.name}
                onChange={handleLeaderChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Position</label>
              <input
                type="text"
                name="position"
                className="form-input"
                placeholder="e.g., President"
                value={currentLeader.position}
                onChange={handleLeaderChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio (Optional)</label>
            <textarea
              name="bio"
              className="form-textarea"
              placeholder="Brief bio or role description..."
              value={currentLeader.bio}
              onChange={handleLeaderChange}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="leader-form-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setIsAdding(false);
                setCurrentLeader({ name: '', position: '', image: '', bio: '' });
              }}
            >
              Cancel
            </button>
            <button
              className="btn-add"
              onClick={addLeader}
              disabled={!currentLeader.name || !currentLeader.position}
            >
              Add Member
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
        >
          Continue
        </button>
      </div>
    </div>
  );
}
