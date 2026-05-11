"use client"

import { useState } from 'react';
import './ContactInfo.css'

export default function ContactInfo({ data, updateData, onNext, onBack }) {
  const [formData, setFormData] = useState({
    memberCount: data.memberCount || 0,
    foundedDate: data.foundedDate || '',
    email: data.email || '',
    phone: data.phone || '',
    website: data.website || '',
    instagram: data.instagram || '',
    twitter: data.twitter || '',
    linkedin: data.linkedin || '',
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    });
  };

  const handleNext = () => {
    if (formData.memberCount && formData.foundedDate && formData.email) {
      updateData(formData);
      onNext();
    }
  };

  const isValid = formData.memberCount > 0 && formData.foundedDate && formData.email;

  return (
    <div className="step-form">
      <h2 className="step-title">Contact Information</h2>
      <p className="step-description">
        Help students connect with your club by providing contact details and social media links.
      </p>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">
            Member Count <span className="required">*</span>
          </label>
          <input
            type="number"
            name="memberCount"
            className="form-input"
            placeholder="e.g., 125"
            value={formData.memberCount || ''}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Founded Date <span className="required">*</span>
          </label>
          <input
            type="date"
            name="foundedDate"
            className="form-input"
            value={formData.foundedDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Email Address <span className="required">*</span>
        </label>
        <input
          type="email"
          name="email"
          className="form-input"
          placeholder="contact@innovationcell.com"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>


      <div className="form-group">
        <label className="form-label">
          Website URL
        </label>
        <input
          type="url"
          name="website"
          className="form-input"
          placeholder="https://innovationcell.com"
          value={formData.website}
          onChange={handleChange}
        />
      </div>

      <div className="form-actions">
        <button className="btn-back" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-next"
          onClick={handleNext}
          disabled={!isValid}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
