"use client"

import { useState } from 'react';
import './LeadershipTeam.css';


export default function LeadershipTeam({ data, updateData, onNext, onBack }) {
  const [leaders, setLeaders] = useState(data.leaders || []);
  const [currentLeader, setCurrentLeader] = useState({
    email: '',
    position: '',
    image: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isResolvingLeader, setIsResolvingLeader] = useState(false);

  const handleLeaderChange = (e) => {
    const { name, value } = e.target;
    setCurrentLeader({ ...currentLeader, [name]: value });
  };

  const resolveLeaderProfileImage = async (email) => {
    try {
      const res = await fetch(`/api/users/profile?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        return '';
      }

      const payload = await res.json();
      return payload?.exists && payload?.image ? payload.image : '';
    } catch {
      return '';
    }
  };

  const addLeader = async () => {
    if (!currentLeader.email || !currentLeader.position) return;

    setIsResolvingLeader(true);
    const email = currentLeader.email.trim().toLowerCase();
    const image = await resolveLeaderProfileImage(email);

    setLeaders([...leaders, { email, position: currentLeader.position.trim(), image }]);
    setCurrentLeader({ email: '', position: '', image: '' });
    setIsAdding(false);
    setIsResolvingLeader(false);
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
        Introduce your club&apos;s leadership team. Students love to know who they&apos;ll be working with!
      </p>

      {leaders.length > 0 && (
        <div className="leaders-grid">
          {leaders.map((leader, index) => (
            <div key={`${leader.email}-${index}`} className="leader-card">
              <div className="leader-image-wrapper">
                {leader.image ? (
                  <img
                    src={leader.image}
                    alt={leader.email}
                    className="leader-image"
                  />
                ) : (
                  <div className="leader-placeholder">
                    {leader.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="leader-info">
                <h3 className="leader-name">{leader.email}</h3>
                <p className="leader-position">{leader.position}</p>
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
            <div className="form-group-l">
              <label className="form-label">Student Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="e.g., user@nitkkr.ac.in"
                value={currentLeader.email}
                onChange={handleLeaderChange}
              />
            </div>

            <div className="form-group-l">
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

          <div className="leader-form-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setIsAdding(false);
                setCurrentLeader({ email: '', position: '', image: '' });
              }}
              disabled={isResolvingLeader}
            >
              Cancel
            </button>
            <button
              className="btn-add"
              onClick={addLeader}
              disabled={!currentLeader.email || !currentLeader.position || isResolvingLeader}
            >
              {isResolvingLeader ? 'Adding...' : 'Add Member'}
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
