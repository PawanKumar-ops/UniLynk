"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import './FormPreview.css';
import { getDraft } from "@/lib/drafts";
import { TeamFinderCard } from "@/components/TeamFinderCard";

export default function FormPreview() {
  const { formId } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const safeFormId = useMemo(() => (formId && formId !== "undefined" ? formId : null), [formId]);


  // LOAD FORM
  useEffect(() => {
    if (!safeFormId) return;

    setLoading(true);

    // Draft check
    if (safeFormId.startsWith("draft_")) {
      const draft = getDraft(safeFormId);

      if (draft) {
        setFormData(draft);
        setLoading(false);
        return;
      }
    }

    // Mongo fetch
    fetch(`/api/forms/${safeFormId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Form not found");
        return res.json();
      })
      .then((data) => {
        setFormData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setFormData(null);
        setLoading(false);
      });

  }, [safeFormId]);


  // ⭐ CHECK IF USER ALREADY APPLIED
  useEffect(() => {
    if (!safeFormId) return;

    fetch(`/api/forms/check-applied?formId=${safeFormId}`)
      .then(res => res.json())
      .then(data => setAlreadyApplied(data.applied));

  }, [safeFormId]);



  const handleSubmit = async (e) => {
    if (alreadyApplied) return;
    if (!safeFormId) return;
    e.preventDefault();
    if (safeFormId.startsWith("draft_")) {
      alert("Draft forms cannot be submitted");
      return;
    }
    const missingRequired = (formData?.questions || []).filter(


      (q) => q.required && !responses[q.id]
    );

    if (missingRequired && missingRequired.length > 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: safeFormId,

          answers: responses,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Submit Error:", err);
        alert(err.error || "Submission failed");
        return;
      }


      setSubmitted(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResponse = (questionId, value) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const current = responses[questionId] ?? [];
    const updated = checked
      ? [...current, option]
      : current.filter((o) => o !== option);
    handleResponse(questionId, updated);
  };

  if (loading) {
    return (
      <div className="not-found-container">
        <p className="not-found-text">Loading form...</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="not-found-container">
        <p className="not-found-text">Form not found</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-inner">
          <div className="success-card">
            <div className="success-icon">
              <CheckCircle2 />
            </div>

            <h2 className="success-title">Response Submitted</h2>
            <p className="success-text">
              Thank you for completing the form. Your response has been recorded.
            </p>
            <Link href="/dashboard/events" className="btn-back-home">
              Back to Forms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-preview-container">
      {/* Header */}
      {/* <header className="form-preview-header">
        <div className="form-preview-header-inner">
          {formData && (
  <Link href={`/FormBuilder/${formData.id}`} className="btn-back">
    <img className='w-2.5' src="/Postimg/backarrow.svg" alt="back" />
  </Link>
)}

        </div>
      </header> */}

      <div className="form-preview-content-shell">
        {/* Form */}
        <main className="form-preview-main">
          <form onSubmit={handleSubmit}>
            {/* Form Header */}
            <div className="form-preview-header-card">
              <div className="form-preview-accent"></div>
              <h1 className="form-preview-title">{formData.title}</h1>
              {formData.description && (
                <p className="form-preview-description">{formData.description}</p>
              )}
              {formData.genre && (
                <div className="form-genre-badge">
                  <Tag />
                  <span>{formData.genre.replace('-', ' ')}</span>
                </div>
              )}
              {(formData.date || formData.time || formData.location) && (
                <div className="event-details-preview-section">
                  <h3 className="event-details-preview-title">Event Details</h3>
                  <div className="event-details-preview-grid">
                    {formData.date && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon">
                          <CalendarIcon />
                        </div>
                        <div className="event-detail-content">
                          <p className="event-detail-label">Date</p>
                          <p className="event-detail-value">{formData.date && format(new Date(formData.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                    {formData.time && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon">
                          <Clock />
                        </div>
                        <div className="event-detail-content">
                          <p className="event-detail-label">Time</p>
                          <p className="event-detail-value">{formData.time}</p>
                        </div>
                      </div>
                    )}
                    {formData.location && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon">
                          <MapPin />
                        </div>
                        <div className="event-detail-content">
                          <p className="event-detail-label">Location</p>
                          <p className="event-detail-value">{formData.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Questions */}
            {(formData.questions || []).map((question) => (
              <div key={question.id} className="question-card">
                <div className="question-text-wrapper">
                  <h3 className="question-text">
                    {question.question}
                    {question.required && <span className="question-required">*</span>}
                  </h3>
                  {question.description && (
                    <p className="question-desc">{question.description}</p>
                  )}
                </div>

                {/* Short Answer */}
                {question.type === 'short' && (
                  <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-text"
                    placeholder="Your answer"
                    required={question.required}
                  />
                )}

                {/* Long Answer */}
                {question.type === 'long' && (
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-textarea"
                    placeholder="Your answer"
                    rows={4}
                    required={question.required}
                  />
                )}

                {/* Email */}
                {question.type === 'email' && (
                  <input
                    type="email"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-text"
                    placeholder="example@email.com"
                    required={question.required}
                  />
                )}

                {/* Phone */}
                {question.type === 'phone' && (
                  <input
                    type="tel"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-text"
                    placeholder="(123) 456-7890"
                    required={question.required}
                  />
                )}

                {/* Date */}
                {question.type === 'date' && (
                  <input
                    type="date"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-text"
                    required={question.required}
                  />
                )}

                {/* Time */}
                {question.type === 'time' && (
                  <input
                    type="time"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="input-text"
                    required={question.required}
                  />
                )}

                {/* Multiple Choice */}
                {question.type === 'multiple' && (
                  <div className="radio-options">
                    {question.options?.map((option, index) => (
                      <label key={index} className="radio-option">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={(e) => handleResponse(question.id, e.target.value)}
                          required={question.required}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Checkbox */}
                {question.type === 'checkbox' && (
                  <div className="checkbox-options">
                    {question.options?.map((option, index) => (
                      <label key={index} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={(responses[question.id] || []).includes(option)}
                          onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Dropdown */}
                {question.type === 'dropdown' && (
                  <select
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponse(question.id, e.target.value)}
                    className="dropdown-select"
                    required={question.required}
                  >
                    <option value="">Choose</option>
                    {question.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                {/* Team Registration */}
                {question.type === 'team' && (() => {
                  const cfg = question.teamConfig || {};
                  const minSize = cfg.minSize ?? 2;
                  const maxSize = cfg.maxSize ?? 5;
                  const memberFields = cfg.memberFields || ['fullName', 'email'];
                  const customFields = cfg.customFields || [];
                  const fieldLabels = {
                    fullName: 'Full Name', email: 'Email', phone: 'Phone',
                    rollNo: 'Roll No.', branch: 'Branch / Dept.', year: 'Year of Study',
                    role: 'Role', linkedin: 'LinkedIn', github: 'GitHub',
                  };

                  const value = responses[question.id] || {
                    mode: 'team', teamName: '',
                    members: [Object.fromEntries([...memberFields, ...customFields].map(f => [f, '']))],
                  };

                  const updateTeam = (patch) => handleResponse(question.id, { ...value, ...patch });
                  const updateMember = (idx, field, v) => {
                    const members = value.members.map((m, i) => i === idx ? { ...m, [field]: v } : m);
                    updateTeam({ members });
                  };
                  const addMember = () => {
                    if (value.members.length >= maxSize) return;
                    updateTeam({
                      members: [...value.members, Object.fromEntries([...memberFields, ...customFields].map(f => [f, '']))],
                    });
                  };
                  const removeMember = (idx) => {
                    if (value.members.length <= 1) return;
                    updateTeam({ members: value.members.filter((_, i) => i !== idx) });
                  };
                  const setMode = (mode) => {
                    if (mode === 'solo') updateTeam({ mode: 'solo', members: value.members.slice(0, 1) });
                    else updateTeam({ mode: 'team' });
                  };

                  return (
                    <div className="team-q">
                      {/* Mode toggle */}
                      <div className="team-q-mode">
                        <button type="button"
                          className={`team-q-mode-btn ${value.mode === 'team' ? 'is-active' : ''}`}
                          onClick={() => setMode('team')}>
                          <span className="team-q-mode-dot" /> I have a team
                        </button>
                        <button type="button"
                          className={`team-q-mode-btn ${value.mode === 'solo' ? 'is-active' : ''}`}
                          onClick={() => setMode('solo')}>
                          <span className="team-q-mode-dot" /> I don't have a team — find one
                        </button>
                      </div>

                      {value.mode === 'solo' ? (
                        <div className="team-q-solo">
                          <p className="team-q-solo-title">You'll be added to the Team Finder</p>
                          <p className="team-q-solo-desc">
                            Other participants looking for teammates will be able to invite you.
                            Fill in your details below — we'll match you with a team of {minSize}–{maxSize}.
                          </p>
                          <div className="team-q-member">
                            <div className="team-q-member-head">
                              <span className="team-q-chip">You</span>
                            </div>
                            <div className="team-q-grid">
                              {[...memberFields, ...customFields].map((f) => (
                                <div key={f} className="team-q-field">
                                  <label>{fieldLabels[f] || f}</label>
                                  <input type={f === 'email' ? 'email' : 'text'}
                                    value={value.members[0]?.[f] || ''}
                                    onChange={(e) => updateMember(0, f, e.target.value)}
                                    placeholder={fieldLabels[f] || f} />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="team-q-meta">
                            <div className="team-q-field team-q-field-full">
                              <label>Team Name</label>
                              <input type="text" value={value.teamName}
                                onChange={(e) => updateTeam({ teamName: e.target.value })}
                                placeholder="e.g. Pixel Pirates" />
                            </div>
                            <div className="team-q-size-hint">
                              {value.members.length} / {maxSize} members
                              <span className="team-q-size-sub">min {minSize}</span>
                            </div>
                          </div>

                          <div className="team-q-members">
                            {value.members.map((member, idx) => (
                              <div key={idx} className="team-q-member">
                                <div className="team-q-member-head">
                                  <span className="team-q-chip">
                                    {idx === 0 ? 'Team Lead' : `Member ${idx + 1}`}
                                  </span>
                                  {idx > 0 && (
                                    <button type="button" className="team-q-remove"
                                      onClick={() => removeMember(idx)}>Remove</button>
                                  )}
                                </div>
                                <div className="team-q-grid">
                                  {[...memberFields, ...customFields].map((f) => (
                                    <div key={f} className="team-q-field">
                                      <label>{fieldLabels[f] || f}</label>
                                      <input type={f === 'email' ? 'email' : 'text'}
                                        value={member[f] || ''}
                                        onChange={(e) => updateMember(idx, f, e.target.value)}
                                        placeholder={fieldLabels[f] || f} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          <button type="button" className="team-q-add"
                            onClick={addMember} disabled={value.members.length >= maxSize}>
                            + Add member
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()}

              </div>
            ))}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-submit"
              disabled={alreadyApplied}
            >
              {alreadyApplied ? "Submitted" : "Submit"}
            </button>
          </form>
        </main>

        <aside className="team-finder-preview-aside" aria-label="Find a team">
          <TeamFinderCard />
        </aside>
      </div>
    </div>
  );
}