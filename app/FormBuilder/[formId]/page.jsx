"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getDraft, saveDraft } from "@/lib/drafts";
import {
  Plus,
  Trash2,
  Eye,
  Type,
  CheckSquare,
  Circle,
  ChevronDown,
  Calendar as CalendarIcon,
  UserRound,
  Clock,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Tag,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import './FormBuilder.css';
import { PublishCard } from '@/components/PublishCard';

const questionTypes = [
  { value: 'short', label: 'Short Answer', icon: Type },
  { value: 'long', label: 'Paragraph', icon: Type },
  { value: 'multiple', label: 'Multiple Choice', icon: Circle },
  { value: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
  { value: 'dropdown', label: 'Dropdown', icon: ChevronDown },
  { value: 'date', label: 'Date', icon: CalendarIcon },
  { value: 'time', label: 'Time', icon: Clock },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
];

const MEMBER_FIELD_OPTIONS = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'rollNo', label: 'Roll No.' },
  { key: 'branch', label: 'Branch / Dept.' },
  { key: 'year', label: 'Year of Study' },
  { key: 'role', label: 'Role' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
];

export default function FormBuilder() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const descriptionRef = useRef(null);
  const publishCardRef = useRef(null);
  const [formData, setFormData] = useState({
    _id: '',
    title: "Untitled Form",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    moreInformation: [],
    seats: "",
    questions: [],
    isTeamEvent: false,
    teamConfig: {
      minSize: 2,
      maxSize: 5,
      memberFields: ['name', 'email'],
      customFields: [],
    },
  });


  const [isPublishCardOpen, setIsPublishCardOpen] = useState(false);
  const [userClubs, setUserClubs] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !params?.formId) return;

    const loadForm = async () => {
      try {
        if (params?.formId?.startsWith("draft_")) {
          const draft = getDraft(params.formId);

          if (draft) {
            setFormData(draft);
            return;
          }

          const newDraft = {
            _id: params.formId,
            title: "Untitled Form",
            description: "",
            image: "",
            questions: [],
            seats: "",
            isTeamEvent: false,
            teamConfig: { minSize: 2, maxSize: 5, memberFields: ['name', 'email'], customFields: [] },
            createdAt: new Date().toISOString(),
          };

          saveDraft(newDraft);
          setFormData(newDraft);
          return;
        }

        const res = await fetch(`/api/forms/${params.formId}`);

        if (res.ok) {
          const data = await res.json();
          setFormData(data);
          return;
        }

        const fallbackDraft = {
          _id: `draft_${Date.now()}`,
          title: "Untitled Form",
          description: "",
          image: "",
          questions: [],
          seats: "",
          isTeamEvent: false,
          teamConfig: { minSize: 2, maxSize: 5, memberFields: ['name', 'email'], customFields: [] },
          createdAt: new Date().toISOString(),
        };

        saveDraft(fallbackDraft);
        setFormData(fallbackDraft);
        router.replace(`/FormBuilder/${fallbackDraft._id}`);

      } catch (error) {
        console.error(error);
      }
    };

    loadForm();
  }, [mounted, params?.formId]);


  useEffect(() => {
    if (!descriptionRef.current) return;
    descriptionRef.current.style.height = "auto";
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [formData.description]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        publishCardRef.current &&
        !publishCardRef.current.contains(event.target)
      ) {
        setIsPublishCardOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    if (!mounted) return;

    const loadUserClubs = async () => {
      try {
        const res = await fetch('/api/clubs?memberOf=true', { cache: 'no-store' });
        if (!res.ok) return;
        const payload = await res.json();

        const clubs = Array.isArray(payload?.clubs)
          ? payload.clubs.map((club) => ({
              id: club._id,
              name: club.clubName,
              members: Number(club.memberCount) || 0,
            }))
          : [];

        setUserClubs(clubs);
      } catch (error) {
        console.error('Failed to load user clubs', error);
      }
    };

    loadUserClubs();
  }, [mounted]);

  const publishForm = async (audience = 'everyone', clubId = '') => {
    if (!formData) return;

    try {
      setPublishing(true);
      const isDraft = formData._id?.startsWith("draft_");
      const isExistingMongoForm = Boolean(formData._id) && !isDraft;
      let res;

      if (isExistingMongoForm) {
        const { _id, ...safeData } = formData;

        const updateRes = await fetch("/api/forms/update", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: _id,
            formData: safeData,
          }),
        });

        if (!updateRes.ok) throw new Error("Failed to save before publishing");

        res = await fetch("/api/forms/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formId: _id,
            clubId: clubId || null,
            visibility: audience,
          }),
        });
      } else {
        const payload = {
          ...formData,
          isPublished: true,
          isPublic: audience === 'everyone',
          visibility: audience,
          clubId: clubId || null,
        };

        if (payload._id?.startsWith("draft_")) {
          delete payload._id;
        }

        res = await fetch("/api/forms/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Publish failed");

      if (formData._id?.startsWith("draft_")) {
        localStorage.removeItem(`draft-${formData._id}`);
      }

      setIsPublishCardOpen(false);
      router.push('/dashboard/events/yourform');

    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };


  const updateForm = (updates) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    if (newData?._id?.startsWith("draft_")) {
      saveDraft(newData);
    }
  };

  const saveChanges = async () => {
    if (!formData?._id) return;

    try {
      const { _id, ...safeData } = formData;

      const res = await fetch("/api/forms/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: _id,
          formData: safeData
        })
      });

      if (!res.ok) throw new Error("Update failed");
      router.push("/dashboard/events/yourform");

    } catch (err) {
      console.error(err);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'short',
      question: 'Untitled Question',
      required: false,
    };
    updateForm({ questions: [...formData.questions, newQuestion] });
  };

  const updateQuestion = (id, updates) => {
    const updatedQuestions = formData.questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    );
    updateForm({ questions: updatedQuestions });
  };

  const deleteQuestion = (id) => {
    updateForm({ questions: formData.questions.filter(q => q.id !== id) });
  };

  const moveQuestionUp = (index) => {
    if (index === 0) return;
    const newQuestions = [...formData.questions];
    [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    updateForm({ questions: newQuestions });
  };

  const moveQuestionDown = (index) => {
    if (index === formData.questions.length - 1) return;
    const newQuestions = [...formData.questions];
    [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    updateForm({ questions: newQuestions });
  };

  const addOption = (questionId) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      updateQuestion(questionId, {
        options: [...question.options, `Option ${question.options.length + 1}`]
      });
    }
  };

  const updateOption = (questionId, optionIndex, value) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId, optionIndex) => {
    const question = formData.questions.find(q => q.id === questionId);
    if (question && question.options && question.options.length > 1) {
      updateQuestion(questionId, {
        options: question.options.filter((_, i) => i !== optionIndex)
      });
    }
  };

  const updateTeamConfig = (updates) => {
    updateForm({
      teamConfig: { ...(formData.teamConfig || {}), ...updates }
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const payload = new FormData();
    payload.append("file", file);

    try {
      setImageUploading(true);
      const res = await fetch("/api/forms/upload-image", {
        method: "POST",
        body: payload,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Image upload failed");

      updateForm({ image: data.url });
    } catch (error) {
      console.error(error);
      alert(error.message || "Image upload failed");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  };

  const toggleMemberField = (fieldKey) => {
    const currentFields = formData.teamConfig?.memberFields || ['name', 'email'];
    const isSelected = currentFields.includes(fieldKey);
    const newFields = isSelected
      ? currentFields.filter(f => f !== fieldKey)
      : [...currentFields, fieldKey];
    updateTeamConfig({ memberFields: newFields });
  };

  const addCustomField = () => {
    const existing = formData.teamConfig?.customFields || [];
    updateTeamConfig({ customFields: [...existing, ''] });
  };

  const updateCustomField = (index, value) => {
    const existing = [...(formData.teamConfig?.customFields || [])];
    existing[index] = value;
    updateTeamConfig({ customFields: existing });
  };

  const removeCustomField = (index) => {
    const existing = formData.teamConfig?.customFields || [];
    updateTeamConfig({ customFields: existing.filter((_, i) => i !== index) });
  };

  const addMoreInformation = () => {
    updateForm({ moreInformation: [...(formData.moreInformation || []), ""] });
  };

  const updateMoreInformation = (index, value) => {
    const items = [...(formData.moreInformation || [])];
    items[index] = value;
    updateForm({ moreInformation: items });
  };

  const removeMoreInformation = (index) => {
    updateForm({ moreInformation: (formData.moreInformation || []).filter((_, itemIndex) => itemIndex !== index) });
  };

  if (!mounted) {
    return (
      <div className="form-builder-container">
        <header className="form-builder-header">
          <div className="form-builder-header-inner">
            <div className="form-builder-header-content">
              <div className="form-builder-header-left">
                <div className="btn-back" style={{ border: '1px solid #e5e7eb' }}></div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading...</div>
              </div>
            </div>
          </div>
        </header>
        <main className="form-builder-main">
          <div className="form-header-card">
            <div className="form-header-accent"></div>
            <div style={{ fontSize: '30px', fontWeight: 600, color: '#9ca3af' }}>Loading form...</div>
          </div>
        </main>
      </div>
    );
  }

  const formId = formData?._id;
  console.log("Preview ID:", formData._id);

  // Always guarantee every field is defined to prevent controlled→uncontrolled errors
  const raw = formData.teamConfig || {};
  const safeTeamConfig = {
    minSize:      raw.minSize      ?? 2,
    maxSize:      raw.maxSize      ?? 5,
    memberFields: raw.memberFields ?? ['name', 'email'],
    customFields: raw.customFields ?? [],
  };

  return (
    <div className="form-builder-container">
      {/* Header */}
      <header className="form-builder-header">
        <div className="form-builder-header-inner">
          <div className="form-builder-header-content">
            <div className="form-builder-header-left">
              <Link href="/dashboard/events/yourform" className="btn-back" aria-label="Back">
                <img className='w-2.5' src="/Postimg/backarrow.svg" alt="back" />
              </Link>

              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                className="form-title-header-input"
                placeholder="Untitled form"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <div className="relative" ref={publishCardRef}>
                <button
                  onClick={formData.isPublished ? saveChanges : () => setIsPublishCardOpen((open) => !open)}
                  className="btn-preview-mode"
                  type="button"
                >
                  {publishing ? "Publishing..." : formData.isPublished ? "Save Changes" : "Publish"}
                </button>
                {!formData.isPublished && (
                  <PublishCard
                    open={isPublishCardOpen}
                    clubs={userClubs}
                    onPublish={publishForm}
                  />
                )}
              </div>
              <button
                disabled={!formData?._id}
                onClick={() => router.push(`/FormPreview/${formData._id}`)}
                className="btn-preview-mode"
                type="button"
              >
                <Eye />
                <span>Preview</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="form-builder-main">
        {/* Form Header Card */}
        <div className="form-header-card">
          <div className="form-header-accent"></div>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            className="form-title-input"
            placeholder="Form Title"
          />
          <textarea
            ref={descriptionRef}
            value={formData.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            className="form-description-input"
            placeholder="Form description"
            rows={2}
          />

          <div className="event-details-section">
            <h3 className="event-details-title">Event Cover Image</h3>
            <div className="event-image-upload-row">
              <div className="form-genre-label-wrapper">
                <ImageIcon />
                <label className="form-genre-label" htmlFor="event-cover-image">
                  Upload image
                </label>
              </div>
              <input
                id="event-cover-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="event-image-upload-input"
                disabled={imageUploading}
              />
            </div>
            {imageUploading && (
              <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
            )}
            {formData.image && (
              <div className="event-upload-preview">
                <img src={formData.image} alt="Event cover preview" />
              </div>
            )}
          </div>

          {/* Genre/Category + Seats */}
          <div className="form-genre-grid">
            <div className="form-genre-section">
              <div className="form-genre-label-wrapper">
                <Tag />
                <label className="form-genre-label">Form Category</label>
              </div>
              <select
                value={formData.genre || ''}
                onChange={(e) => updateForm({ genre: e.target.value })}
                className="form-genre-select"
              >
                <option value="">Select a category</option>
                <option value="Event Registration">Event Registration</option>
                <option value="Survey">Survey</option>
                <option value="Feedback">Feedback</option>
                <option value="Contact Form">Contact Form</option>
                <option value="RSVP">RSVP</option>
                <option value="Application">Application</option>
                <option value="Quiz/Test">Quiz/Test</option>
                <option value="Order Form">Order Form</option>
                <option value="Booking/Reservation">Booking/Reservation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-seats-section">
              <div className="form-genre-label-wrapper">
                <label className="form-genre-label event-field-label"><UserRound />No. of seats</label>
              </div>
              <input
                type="number"
                min="0"
                value={formData.seats ?? ''}
                onChange={(e) => updateForm({ seats: e.target.value === '' ? '' : Number(e.target.value) })}
                className="form-seats-input"
                placeholder="Enter number of seats"
              />
            </div>
          </div>

          {/* Date, Time, Location Section */}
          <div className="event-details-section">
            <h3 className="event-details-title">Event Details (Optional)</h3>
            <div className="event-details-grid">
              <div className="event-field">
                <label className="event-field-label">
                  <CalendarIcon />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date ? formData.date.split('T')[0] : ''}
                  onChange={(e) => updateForm({ date: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                  className="date-picker-button"
                />
              </div>

              <div className="event-field">
                <label className="event-field-label">
                  <Clock />
                  Time
                </label>
                <div>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => updateForm({ time: e.target.value })}
                    className="time-input"
                    placeholder="Select time"
                  />
                </div>
              </div>

              <div className="event-field">
                <label className="event-field-label">
                  <MapPin />
                  Location
                </label>
                <div>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => updateForm({ location: e.target.value })}
                    className="location-input"
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="event-details-section">
            <h3 className="event-details-title">More Information</h3>
            {(formData.moreInformation || []).map((item, index) => (
              <div key={index} className="event-field" style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={item}
                  onChange={(event) => updateMoreInformation(index, event.target.value)}
                  className="location-input"
                  placeholder="Add a point"
                />
                <button type="button" onClick={() => removeMoreInformation(index)} className="btn-move" aria-label="Remove information point">
                  <Trash2 />
                </button>
              </div>
            ))}
            <button type="button" onClick={addMoreInformation} className="btn-add-question">
              <Plus /> Add information point
            </button>
          </div>

          {/* Team Event Toggle */}
          <div className="team-event-toggle-section">
            <label className="team-toggle-row">
              <div className="team-toggle-info">
                <Users className="team-toggle-icon" />
                <div>
                  <div className="team-toggle-title">Is this a team based event?</div>
                  <div className="team-toggle-desc">Collect information from each member separately</div>
                </div>
              </div>
              <div className="toggle-switch" aria-label="Toggle team event">
                <input
                  type="checkbox"
                  checked={formData.isTeamEvent || false}
                  onChange={(e) => updateForm({ isTeamEvent: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>

        {/* Team Configuration Card — Notion style */}
        {formData.isTeamEvent && (
          <div className="team-config-card">
            {/* Card header */}
            <div className="team-config-header">
              <span className="team-config-title">Team Setup</span>
            </div>

            {/* Property table */}
            <div className="team-config-body">

              {/* Team size row */}
              <div className="team-config-row">
                <span className="team-config-row-label">Team size</span>
                <div className="team-config-row-value">
                  <div className="team-size-inputs">
                    <div className="team-size-field">
                      <span className="team-size-field-label">min</span>
                      <input
                        type="number"
                        min="1"
                        max={safeTeamConfig.maxSize}
                        value={safeTeamConfig.minSize}
                        onChange={(e) => updateTeamConfig({ minSize: Math.max(1, Number(e.target.value)) })}
                        className="team-size-input"
                      />
                    </div>
                    <span className="team-size-divider">—</span>
                    <div className="team-size-field">
                      <span className="team-size-field-label">max</span>
                      <input
                        type="number"
                        min={safeTeamConfig.minSize}
                        value={safeTeamConfig.maxSize}
                        onChange={(e) => updateTeamConfig({ maxSize: Math.max(safeTeamConfig.minSize, Number(e.target.value)) })}
                        className="team-size-input"
                      />
                    </div>
                    <span className="team-size-desc">members per team</span>
                  </div>
                </div>
              </div>

              {/* Per-member fields row */}
              <div className="team-config-row team-config-row--top">
                <span className="team-config-row-label">Per member</span>
                <div className="team-config-row-value">
                  <div className="member-fields-grid">
                    {MEMBER_FIELD_OPTIONS.map((field) => {
                      const isSelected = safeTeamConfig.memberFields.includes(field.key);
                      return (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => toggleMemberField(field.key)}
                          className={`member-field-chip${isSelected ? ' member-field-chip--active' : ''}`}
                        >
                          <span className="notion-checkbox">
                            {isSelected && (
                              <svg viewBox="0 0 10 8" fill="none" className="notion-checkmark">
                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          {field.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Custom fields row */}
              <div className="team-config-row team-config-row--top">
                <span className="team-config-row-label">Custom fields</span>
                <div className="team-config-row-value custom-fields-value">
                  {safeTeamConfig.customFields.map((cf, idx) => (
                    <div key={idx} className="custom-field-row">
                      <input
                        type="text"
                        value={cf}
                        onChange={(e) => updateCustomField(idx, e.target.value)}
                        placeholder="e.g. T-shirt size"
                        className="custom-field-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(idx)}
                        className="btn-remove-custom-field"
                        aria-label="Remove field"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="btn-add-custom-field"
                  >
                    <Plus size={13} />
                    Add field
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Questions */}
        {formData.questions.map((question, index) => (
          <div key={question.id} className="question-item">
            <div className="question-header">
              <div className="question-move-buttons">
                <button
                  onClick={() => moveQuestionUp(index)}
                  disabled={index === 0}
                  className="btn-move"
                  title="Move up"
                  type="button"
                >
                  <ChevronUp />
                </button>
                <button
                  onClick={() => moveQuestionDown(index)}
                  disabled={index === formData.questions.length - 1}
                  className="btn-move"
                  title="Move down"
                  type="button"
                >
                  <ChevronDownIcon />
                </button>
              </div>
              <div className="question-main">
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  className="question-input"
                  placeholder="Question"
                />
                <input
                  type="text"
                  value={question.description || ''}
                  onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                  className="question-description-input"
                  placeholder="Description (optional)"
                />
              </div>
              <select
                value={question.type}
                onChange={(e) => updateQuestion(question.id, {
                  type: e.target.value,
                  options: ['multiple', 'checkbox', 'dropdown'].includes(e.target.value) ? ['Option 1'] : undefined
                })}
                className="question-type-select"
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Question Options */}
            {['multiple', 'checkbox', 'dropdown'].includes(question.type) && (
              <div className="question-options">
                {question.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="question-option">
                    {question.type === 'multiple' && (
                      <Circle className="question-option-icon" />
                    )}
                    {question.type === 'checkbox' && (
                      <CheckSquare className="question-option-icon" />
                    )}
                    {question.type === 'dropdown' && (
                      <span className="question-option-icon">{optionIndex + 1}.</span>
                    )}
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                      className="question-option-input"
                    />
                    <button
                      onClick={() => deleteOption(question.id, optionIndex)}
                      className="btn-remove-option"
                      type="button"
                    >
                      <Trash2 />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addOption(question.id)}
                  className="btn-add-option"
                  type="button"
                >
                  <Plus />
                  Add option
                </button>
              </div>
            )}

            {/* Question Preview */}
            {question.type === 'short' && (
              <div className="question-preview">
                <input
                  type="text"
                  placeholder="Short answer text"
                  className="preview-input-short"
                  disabled
                  readOnly
                />
              </div>
            )}
            {question.type === 'long' && (
              <div className="question-preview">
                <textarea
                  placeholder="Long answer text"
                  className="preview-textarea"
                  rows={3}
                  disabled
                  readOnly
                />
              </div>
            )}
            {question.type === 'email' && (
              <div className="question-preview">
                <input
                  type="email"
                  placeholder="Email address"
                  className="preview-input-email"
                  disabled
                  readOnly
                />
              </div>
            )}
            {question.type === 'phone' && (
              <div className="question-preview">
                <input
                  type="tel"
                  placeholder="Phone number"
                  className="preview-input-phone"
                  disabled
                  readOnly
                />
              </div>
            )}
            {question.type === 'date' && (
              <div className="question-preview">
                <input
                  type="date"
                  className="preview-input-date"
                  disabled
                  readOnly
                />
              </div>
            )}
            {question.type === 'time' && (
              <div className="question-preview">
                <input
                  type="time"
                  className="preview-input-time"
                  disabled
                  readOnly
                />
              </div>
            )}

            {/* Question Actions */}
            <div className="question-footer">
              <button
                onClick={() => deleteQuestion(question.id)}
                className="btn-delete-question"
                type="button"
              >
                <Trash2 />
                Delete
              </button>
              <label className="required-toggle">
                <span className="required-toggle-label">Required</span>
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                />
              </label>
            </div>
          </div>
        ))}

        {/* Add Question Button */}
        <button onClick={addQuestion} className="btn-add-question" type="button">
          <Plus />
          Add Question
        </button>
      </main>
    </div>
  );
}
