"use client"

import { useState } from 'react';
import ImageCropper from '@/components/ImageCropper';
import { Users, Image as ImageIcon } from 'lucide-react';
import './BasicInfo.css';

export default function BasicInfo({ data, updateData, onNext }) {
  const [formData, setFormData] = useState({
    clubName: data.clubName || '',
    category: data.category || '',
    description: data.description || '',
  });

  const [logoPreview, setLogoPreview] = useState(data.logo || '');
  const [bannerPreview, setBannerPreview] = useState(data.banner || '');
  
  const [cropperImage, setCropperImage] = useState(null);
  const [cropperType, setCropperType] = useState(null);

  const categories = [
    'Innovation',
    'Technology',
    'Arts & Culture',
    'Sports & Fitness',
    'Social Impact',
    'Business & Entrepreneurship',
    'Science & Research',
    'Media & Communication',
    'Environment & Sustainability',
    'Other',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result);
        setCropperType('logo');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result);
        setCropperType('banner');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    if (cropperType === 'logo') {
      setLogoPreview(croppedImage);
    } else if (cropperType === 'banner') {
      setBannerPreview(croppedImage);
    }
    setCropperImage(null);
    setCropperType(null);
  };

  const handleCropCancel = () => {
    setCropperImage(null);
    setCropperType(null);
  };

  const handleNext = () => {
    if (formData.clubName && formData.category && formData.description) {
      updateData({
        clubName: formData.clubName,
        category: formData.category,
        description: formData.description,
        logo: logoPreview,
        banner: bannerPreview,
      });
      onNext();
    }
  };

  const isValid = formData.clubName && formData.category && formData.description;

  return (
    <div className="step-form">
      <h2 className="step-title">Basic Information</h2>
      <p className="step-description">
        Let's start with the basics. Tell us about your club and what makes it unique.
      </p>

      {/* Banner Upload */}
      <div className="form-group">
        <label className="form-label">Club Banner</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleBannerUpload}
          style={{ display: 'none' }}
          id="banner-upload"
        />
        <label htmlFor="banner-upload" className="banner-upload-area">
          {bannerPreview ? (
            <div className="banner-preview-wrapper">
              <img src={bannerPreview} alt="Banner preview" className="banner-preview-image" />
              <div className="banner-overlay">
                <span className="change-banner-text">Click to change banner</span>
              </div>
            </div>
          ) : (
            <div className="banner-placeholder">
              <div className="banner-icon"><ImageIcon /></div>
              <p className="banner-text">Click to upload club banner</p>
              <p className="banner-hint">Recommended: 1512x400px, PNG or JPG</p>
            </div>
          )}
        </label>
      </div>

      {/* Logo Upload */}
      <div className="form-group">
        <label className="form-label">Club Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoUpload}
          style={{ display: 'none' }}
          id="logo-upload"
        />
        <label htmlFor="logo-upload" className="logo-upload-area">
          {logoPreview ? (
            <div className="logo-preview-wrapper">
              <img src={logoPreview} alt="Logo preview" className="logo-preview-image" />
              <div className="logo-overlay">
                <span className="change-logo-text">Change</span>
              </div>
            </div>
          ) : (
            <div className="logo-placeholder">
              <div className="logo-icon"><Users /></div>
              <p className="logo-text">Upload Logo</p>
            </div>
          )}
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Club Name <span className="required">*</span>
        </label>
        <input
          type="text"
          name="clubName"
          className="form-input"
          placeholder="e.g., Innovation Cell"
          value={formData.clubName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Category <span className="required">*</span>
        </label>
        <select
          name="category"
          className="form-select"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          Club Description <span className="required">*</span>
        </label>
        <textarea
          name="description"
          className="form-textarea"
          placeholder="Tell us about your club, its mission, and what members can expect..."
          value={formData.description}
          onChange={handleChange}
          required
        />
        <p className="form-hint">Minimum 50 characters</p>
      </div>

      <div className="form-actions">
        <button
          className="btn-next"
          onClick={handleNext}
          disabled={!isValid}
        >
          Continue
        </button>
      </div>

      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={cropperType === 'logo' ? 1 : 3.782}
          cropShape={cropperType === 'logo' ? 'circle' : 'rect'}
          targetWidth={cropperType === 'logo' ? 192 : 1513}
          targetHeight={cropperType === 'logo' ? 192 : 400}
        />
      )}
    </div>
  );
}