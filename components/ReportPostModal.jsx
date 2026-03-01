"use client"

import { useState } from 'react';
import './ReportPostModal.css';

const reportReasons = [
  { id: 'spam', label: 'Spam or misleading', description: 'Fake engagement, scams, or misleading information' },
  { id: 'harassment', label: 'Harassment or bullying', description: 'Targeting or attacking individuals or groups' },
  { id: 'hate-speech', label: 'Hate speech', description: 'Content that attacks people based on identity' },
  { id: 'violence', label: 'Violence or dangerous behavior', description: 'Threats or promotion of violence' },
  { id: 'inappropriate', label: 'Inappropriate content', description: 'Content that violates community guidelines' },
  { id: 'false-info', label: 'False information', description: 'Deliberately false or misleading content' },
  { id: 'other', label: 'Other', description: 'Something else' },
];

export function ReportPostModal({ isOpen, onClose, postId }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedReason) return;

    // Mock submission
    console.log('Report submitted:', { postId, reason: selectedReason, details: additionalDetails });
    setIsSubmitted(true);
    
    // Reset after 2 seconds and close
    setTimeout(() => {
      setIsSubmitted(false);
      setSelectedReason('');
      setAdditionalDetails('');
      onClose();
    }, 2000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="report-modal-overlay" onClick={handleBackdropClick}>
      <div className="report-modal">
        {!isSubmitted ? (
          <>
            <div className="report-modal-header">
              <h2>Report Post</h2>
              <button className="close-button" onClick={onClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="report-modal-body">
              <p className="report-modal-description">
                Help us understand what's happening with this post. Your report is anonymous.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="report-reasons">
                  {reportReasons.map((reason) => (
                    <label
                      key={reason.id}
                      className={`report-reason-item ${selectedReason === reason.id ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="report-reason"
                        value={reason.id}
                        checked={selectedReason === reason.id}
                        onChange={(e) => setSelectedReason(e.target.value)}
                      />
                      <div className="report-reason-content">
                        <span className="report-reason-label">{reason.label}</span>
                        <span className="report-reason-description">{reason.description}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="additional-details">
                  <label htmlFor="details">Additional details (optional)</label>
                  <textarea
                    id="details"
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Provide any additional context that might help us review this report..."
                    rows={4}
                  />
                </div>

                <div className="report-modal-footer">
                  <button type="button" className="button-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button-primary"
                    disabled={!selectedReason}
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="report-success">
            <div className="success-icon">✓</div>
            <h3>Report Submitted</h3>
            <p>Thank you for helping keep our community safe. We'll review this report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
