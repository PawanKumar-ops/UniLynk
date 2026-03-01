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
    }, 3000);
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

              <form>
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

              </form>
            </div>
            <div className="report-modal-footer">
              <button type="button" className="button-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={!selectedReason}
                onClick={handleSubmit}
              >
                Submit Report
              </button>
            </div>
          </>
        ) : (
          <div className="report-success">
            <div className="success-icon"><svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 60 60" viewBox="0 0 60 60" id="approve">
              <path d="M30,6C16.7666016,6,6,16.7666016,6,30s10.7666016,24,24,24s24-10.7666016,24-24S43.2333984,6,30,6z M30,52
	C17.8691406,52,8,42.1308594,8,30S17.8691406,8,30,8s22,9.8691406,22,22S42.1308594,52,30,52z"></path>
              <polygon points="25.608 36.577 19.116 30.086 17.702 31.5 25.608 39.405 42.298 22.715 40.884 21.301"></polygon>
            </svg></div>
            <h3>Report Submitted</h3>
            <p>Thank you for helping keep our community safe. We'll review this report.</p>
          </div>
        )}
      </div>
    </div>
  );
}
