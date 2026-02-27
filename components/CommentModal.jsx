"use client"

import { useState } from 'react';
import './CommentModal.css';

const CommentModal = ({ isOpen, onClose, onSubmit }) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment('');
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">Add a Comment</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <textarea
            className="comment-textarea"
            placeholder="Write your comment here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={6}
            autoFocus
          />
        </div>
        
        <div className="modal-footer">
          <button className="modal-button modal-button-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="modal-button modal-button-submit" 
            onClick={handleSubmit}
            disabled={!comment.trim()}
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentModal;