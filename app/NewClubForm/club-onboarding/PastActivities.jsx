"use client"

import { useState } from 'react';
import { Camera } from 'lucide-react';
import './PastActivities.css';

export default function PastActivities({ data, updateData, onSubmit, onBack }) {
  const [pastEvents, setPastEvents] = useState(data.pastEvents || []);
  const [currentEvent, setCurrentEvent] = useState({
    title: '',
    date: '',
    location: '',
    participants: 0,
    description: '',
    images: [],
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleEventChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentEvent({
      ...currentEvent,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    });
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newImages = [];
      let loaded = 0;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result);
          loaded++;
          if (loaded === files.length) {
            setCurrentEvent({
              ...currentEvent,
              images: [...currentEvent.images, ...newImages],
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setCurrentEvent({
      ...currentEvent,
      images: currentEvent.images.filter((_, i) => i !== index),
    });
  };

  const addEvent = () => {
    if (currentEvent.title && currentEvent.date && currentEvent.description) {
      setPastEvents([...pastEvents, currentEvent]);
      setCurrentEvent({
        title: '',
        date: '',
        location: '',
        participants: 0,
        description: '',
        images: [],
      });
      setIsAdding(false);
    }
  };

  const removeEvent = (index) => {
    setPastEvents(pastEvents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const updatedData = { ...data, pastEvents };

    updateData({ pastEvents });
    onSubmit(updatedData);
  };

  return (
    <div className="step-form">
      <h2 className="step-title">Past Activities</h2>
      <p className="step-description">
        Showcase your club's successful past events to demonstrate your track record and engagement level.
      </p>

      {pastEvents.length > 0 && (
        <div className="past-events-list">
          {pastEvents.map((event, index) => (
            <div key={index} className="past-event-card">
              <div className="past-event-header">
                <div>
                  <h3 className="past-event-title">{event.title}</h3>
                  <div className="past-event-meta">
                    <span className="meta-item">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {event.location && <span className="meta-item"> {event.location}</span>}
                    {event.participants > 0 && <span className="meta-item">{event.participants} participants</span>}
                  </div>
                </div>
                <button
                  className="btn-remove-event"
                  onClick={() => removeEvent(index)}
                >
                  Remove
                </button>
              </div>
              <p className="past-event-description">{event.description}</p>
              {event.images.length > 0 && (
                <div className="past-event-images">
                  {event.images.map((img, imgIndex) => (
                    <img key={imgIndex} src={img} alt={`${event.title} ${imgIndex + 1}`} className="past-event-image" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAdding && (
        <button
          className="btn-add-event"
          onClick={() => setIsAdding(true)}
        >
          + Add Past Event
        </button>
      )}

      {isAdding && (
        <div className="event-form">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., Design Thinking Workshop 2025"
              value={currentEvent.title}
              onChange={handleEventChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                name="date"
                className="form-input"
                value={currentEvent.date}
                onChange={handleEventChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Participants</label>
              <input
                type="number"
                name="participants"
                className="form-input"
                placeholder="e.g., 120"
                value={currentEvent.participants || ''}
                onChange={handleEventChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              className="form-input"
              placeholder="e.g., Main Auditorium"
              value={currentEvent.location}
              onChange={handleEventChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe what happened at this event..."
              value={currentEvent.description}
              onChange={handleEventChange}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Event Photos (Optional)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="event-images"
            />
            <label htmlFor="event-images" className="file-upload-button">
              <div><Camera /></div> Upload Photos
            </label>
            {currentEvent.images.length > 0 && (
              <div className="image-previews">
                {currentEvent.images.map((img, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={img} alt={`Preview ${index + 1}`} />
                    <button
                      className="btn-remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="event-form-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setIsAdding(false);
                setCurrentEvent({
                  title: '',
                  date: '',
                  location: '',
                  participants: 0,
                  description: '',
                  images: [],
                });
              }}
            >
              Cancel
            </button>
            <button
              className="btn-add"
              onClick={addEvent}
              disabled={!currentEvent.title || !currentEvent.date || !currentEvent.description}
            >
              Add Event
            </button>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-submit"
          onClick={handleSubmit}
        >
          Complete Registration
        </button>
      </div>
    </div>
  );
}
