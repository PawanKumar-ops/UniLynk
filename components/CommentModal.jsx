"use client"

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Smile,
    Image as ImageIcon,
} from 'lucide-react';
import './CommentModal.css';

const CommentModal = ({ isOpen, onClose, onSubmit }) => {
    const [comment, setComment] = useState('');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose?.();
            }
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setComment('');

        }
    }, [isOpen]);

    if (!isOpen || !isMounted) return null;

    const handleSubmit = () => {
        const trimmedComment = comment.trim();
        if (!trimmedComment) return;

        if (typeof onSubmit === 'function') {
            onSubmit(trimmedComment);
        }

        onClose?.();
    };

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

    const modal = (
        <div className="comment-modal-overlay" onClick={handleOverlayClick}>
            <div
                className="comment-modal-container"
                role="dialog"
                aria-modal="true"
                aria-labelledby="comment-modal-title"
            >
                <div className="comment-modal-header">
                    <h2 id="comment-modal-title" className="comment-modal-title">Add a Comment</h2>
                    <button className="comment-modal-close" onClick={onClose} aria-label="Close comment modal" type="button">
                        ×
                    </button>
                </div>

                <div className="comment-modal-body">
                    <textarea
                        className="comment-textarea"
                        placeholder="Write your comment here..."
                        value={comment}
                        onChange={(event) => setComment(event.target.value)}
                        onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                        rows={6}
                        autoFocus
                        maxLength={1000}
                    />
                </div>

                <div className="comment-modal-footer">
                    <div className="comment-modal-footer-left">
                        <button className='comment-modalfoot-left-btn'><Smile width={20} /></button>

                        <button className='comment-modalfoot-left-btn'><ImageIcon width={20} /></button>

                        <button className='comment-modalfoot-left-btn'><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill='#545454' id="gif">
                            <path fill="none" d="M0 0h24v24H0V0z"></path>
                            <path d="M12.25 9c.41 0 .75.34.75.75v4.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75v-4.5c0-.41.34-.75.75-.75zM10 9.75c0-.41-.34-.75-.75-.75H6c-.6 0-1 .5-1 1v4c0 .5.4 1 1 1h3c.6 0 1-.5 1-1v-1.25c0-.41-.34-.75-.75-.75s-.75.34-.75.75v.75h-2v-3h2.75c.41 0 .75-.34.75-.75zm9 0c0-.41-.34-.75-.75-.75H15.5c-.55 0-1 .45-1 1v4.25c0 .41.34.75.75.75s.75-.34.75-.75V13h1.25c.41 0 .75-.34.75-.75s-.34-.75-.75-.75H16v-1h2.25c.41 0 .75-.34.75-.75z"></path>
                        </svg></button>

                    </div>
                    <div className="comment-modal-footer-right">
                        <button className="comment-modal-button comment-modal-button-cancel" onClick={onClose} type="button">
                            Cancel
                        </button>
                        <button
                            className="comment-modal-button comment-modal-button-submit"
                            onClick={handleSubmit}
                            disabled={!comment.trim()}
                            type="button"
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
    return createPortal(modal, document.body);
}

export default CommentModal;