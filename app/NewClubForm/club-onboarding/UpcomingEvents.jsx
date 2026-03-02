"use client"

import { useState } from 'react';
import './UpcomingEvents.css';

export default function UpcomingEvents({ data, updateData, onBack, onSubmit }) {
  const [upcomingEvents, setUpcomingEvents] = useState(data.upcomingEvents || []);
  const [currentEvent, setCurrentEvent] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    seats: 0,
    seatsAvailable: 0,
  });

  const [isAdding, setIsAdding] = useState(false);

  const handleEventChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setCurrentEvent({
      ...currentEvent,
      [name]: newValue,
      ...(name === 'seats' && { seatsAvailable: newValue }),
    });
  };

  const addEvent = () => {
    if (currentEvent.title && currentEvent.date && currentEvent.description) {
      setUpcomingEvents([...upcomingEvents, currentEvent]);
      setCurrentEvent({
        title: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        description: '',
        seats: 0,
        seatsAvailable: 0,
      });
      setIsAdding(false);
    }
  };

  const removeEvent = (index) => {
    setUpcomingEvents(upcomingEvents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    updateData({ upcomingEvents });
    onSubmit();
  };

  return (
    <div className="step-form">
      <h2 className="step-title">Upcoming Events</h2>
      <p className="step-description">
        Share your upcoming events to attract students who are interested in participating. This is optional but highly recommended!
      </p>

      {upcomingEvents.length > 0 && (
        <div className="upcoming-events-list">
          {upcomingEvents.map((event, index) => (
            <div key={index} className="upcoming-event-card">
              <div className="upcoming-event-header">
                <div className="event-badge">UPCOMING</div>
                <button
                  className="btn-remove-upcoming"
                  onClick={() => removeEvent(index)}
                >
                  Remove
                </button>
              </div>
              
              <h3 className="upcoming-event-title">{event.title}</h3>
              
              <div className="upcoming-event-details">
                <div className="detail-row">
                  <span className="detail-icon">📅</span>
                  <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                
                {(event.startTime || event.endTime) && (
                  <div className="detail-row">
                    <span className="detail-icon">🕐</span>
                    <span>
                      {event.startTime} {event.endTime && `- ${event.endTime}`}
                    </span>
                  </div>
                )}
                
                {event.location && (
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <p className="upcoming-event-description">{event.description}</p>

              {event.seats > 0 && (
                <div className="event-seats">
                  <div className="seats-info">
                    <span className="seats-label">Seats:</span>
                    <span className="seats-count">{event.seatsAvailable}/{event.seats}</span>
                  </div>
                  <div className="seats-progress">
                    <div
                      className="seats-progress-fill"
                      style={{ width: `${(event.seatsAvailable / event.seats) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAdding && (
        <button
          className="btn-add-upcoming"
          onClick={() => setIsAdding(true)}
        >
          + Add Upcoming Event
        </button>
      )}

      {isAdding && (
        <div className="upcoming-event-form">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="e.g., Web3 & Blockchain Workshop"
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
              <label className="form-label">Start Time</label>
              <input
                type="time"
                name="startTime"
                className="form-input"
                value={currentEvent.startTime}
                onChange={handleEventChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="time"
                name="endTime"
                className="form-input"
                value={currentEvent.endTime}
                onChange={handleEventChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                className="form-input"
                placeholder="e.g., Lab 3"
                value={currentEvent.location}
                onChange={handleEventChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Seats</label>
              <input
                type="number"
                name="seats"
                className="form-input"
                placeholder="e.g., 25"
                value={currentEvent.seats || ''}
                onChange={handleEventChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe what students will learn or experience..."
              value={currentEvent.description}
              onChange={handleEventChange}
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="upcoming-event-form-actions">
            <button
              className="btn-cancel"
              onClick={() => {
                setIsAdding(false);
                setCurrentEvent({
                  title: '',
                  date: '',
                  startTime: '',
                  endTime: '',
                  location: '',
                  description: '',
                  seats: 0,
                  seatsAvailable: 0,
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
