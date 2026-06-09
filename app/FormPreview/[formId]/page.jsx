"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, Tag, Plus, Users, X } from 'lucide-react';
import { format } from 'date-fns';
import './FormPreview.css';
import { getDraft } from "@/lib/drafts";
import { TeamFinderCard } from "@/components/TeamFinderCard";

const TEAM_REGISTRATION_ANSWER_ID = "teamRegistration";
const DEFAULT_TEAM_CONFIG = {
  minSize: 2,
  maxSize: 5,
  memberFields: ['name', 'email'],
  customFields: [],
};

const TEAM_FIELD_LABELS = {
  name: 'Full Name',
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  rollNo: 'Roll No.',
  branch: 'Branch / Dept.',
  year: 'Year of Study',
  role: 'Role',
  linkedin: 'LinkedIn',
  github: 'GitHub',
};

const getTeamFields = (teamConfig = {}) => {
  const memberFields = teamConfig.memberFields?.length
    ? teamConfig.memberFields
    : DEFAULT_TEAM_CONFIG.memberFields;
  const customFields = teamConfig.customFields || [];
  return [...memberFields, ...customFields].filter(Boolean);
};

const createEmptyMember = (teamConfig = {}) => (
  Object.fromEntries(getTeamFields(teamConfig).map((field) => [field, '']))
);

const normalizeTeamConfig = (teamConfig = {}) => ({
  minSize: Number(teamConfig.minSize) || DEFAULT_TEAM_CONFIG.minSize,
  maxSize: Number(teamConfig.maxSize) || DEFAULT_TEAM_CONFIG.maxSize,
  memberFields: teamConfig.memberFields?.length
    ? teamConfig.memberFields
    : DEFAULT_TEAM_CONFIG.memberFields,
  customFields: teamConfig.customFields || [],
});

const createDefaultTeamAnswer = (teamConfig = {}) => ({
  mode: 'team',
  teamName: '',
  members: [createEmptyMember(teamConfig)],
});

function TeamRegistrationCard({ teamConfig, value, onChange, onFindTeammates }) {
  const cfg = normalizeTeamConfig(teamConfig);
  const minSize = cfg.minSize;
  const maxSize = Math.max(minSize, cfg.maxSize);
  const allFields = getTeamFields(cfg);
  const safeValue = value || createDefaultTeamAnswer(cfg);
  const members = safeValue.members?.length ? safeValue.members : [createEmptyMember(cfg)];

  const updateTeam = (patch) => onChange({ ...safeValue, members, ...patch });
  const updateMember = (idx, field, v) => {
    const updatedMembers = members.map((m, i) => (i === idx ? { ...m, [field]: v } : m));
    updateTeam({ members: updatedMembers });
  };
  const addMember = () => {
    if (members.length >= maxSize) return;
    updateTeam({ members: [...members, createEmptyMember(cfg)] });
  };
  const removeMember = (idx) => {
    if (members.length <= 1) return;
    updateTeam({ members: members.filter((_, i) => i !== idx) });
  };
  const setMode = (mode) => {
    if (mode === 'solo') updateTeam({ mode: 'solo', members: members.slice(0, 1) });
    else updateTeam({ mode: 'team' });
  };

  return (
    <div className="team-q">
      {/* Mode toggle */}
      <div className="team-q-mode">
        <div
          className="team-q-mode-indicator"
          style={{
            transform:
              safeValue.mode === "team"
                ? "translateX(0%)"
                : "translateX(100%)",
          }}
        />
        <button
          type="button"
          className={`team-q-mode-btn ${safeValue.mode === "team" ? "is-active" : ""}`}
          onClick={() => setMode("team")}
        >
          Create Team
        </button>
        <button
          type="button"
          className={`team-q-mode-btn ${safeValue.mode === "solo" ? "is-active" : ""}`}
          onClick={() => setMode("solo")}
        >
          Join Team
        </button>
      </div>

      {safeValue.mode === 'solo' ? (
        <div className="team-q-solo">
          <p className="team-q-solo-title">You'll be added to the Team Finder</p>
          <p className="team-q-solo-desc">
            Other participants looking for teammates will be able to invite you.
            Fill in your details below — we'll match you with a team of {minSize}–{maxSize}.
          </p>
          <div className="team-q-member no-team-card">
            <div className="team-finder-actions">
              <button type="button" className="team-finder-btn team-finder-btn-primary">
                Add me to Team Finder
              </button>
              <button
                type="button"
                className="team-finder-btn"
                onClick={onFindTeammates}
              >
                Find Teammates / Team
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="team-q-meta">
            <div className="team-q-field team-q-field-full">
              <label>Team Name</label>
              <input
                type="text"
                value={safeValue.teamName || ''}
                onChange={(e) => updateTeam({ teamName: e.target.value })}
                placeholder="e.g. Pixel Pirates"
              />
            </div>
            <div className="team-q-size-hint">
              {members.length} / {maxSize} members
              <span className="team-q-size-sub">min {minSize}</span>
            </div>
          </div>

          <div className="team-q-members">
            {members.map((member, idx) => (
              <div key={idx} className="team-q-member">
                <div className="team-q-member-head">
                  <span className="team-q-chip">
                    {idx === 0 ? 'Team Lead' : `Member ${idx + 1}`}
                  </span>
                  {idx > 0 && (
                    <button type="button" className="team-q-remove" onClick={() => removeMember(idx)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="team-q-grid">
                  {allFields.map((f) => (
                    <div key={f} className="team-q-field">
                      <label>{TEAM_FIELD_LABELS[f] || f}</label>
                      <input
                        type={f === 'email' ? 'email' : 'text'}
                        value={member[f] || ''}
                        onChange={(e) => updateMember(idx, f, e.target.value)}
                        placeholder={TEAM_FIELD_LABELS[f] || f}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              className="team-q-add flex gap-1 items-center justify-center p-2 rounded-lg"
              onClick={addMember}
              disabled={members.length >= maxSize}
            >
              <Plus height={15} width={15} />
              <div>Add member</div>
            </button>

            <button
              type="button"
              className="team-q-add-teamfinder flex gap-1 items-center justify-center p-2 rounded-lg bg-black text-white"
              onClick={onFindTeammates}
            >
              <div>Add team to TeamFinder</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Floating Team Finder Hint ────────────────────────────────────────────────

function TeamFinderHint({ hintPos, onDismiss }) {
  // hintPos = { left, width } for desktop fixed float; null = mobile inline
  const isFloating = hintPos !== null;

  const content = (
    <>
      <div className="tfhf-icon-wrap">
        <Users size={15} strokeWidth={2} />
      </div>
      <div className="tfhf-body">
        <p className="tfhf-title">Find your team using Team Finder</p>
        <p className="tfhf-desc">Browse solo applicants and open teams to find your match.</p>
      </div>
      <button type="button" className="tfhf-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={12} strokeWidth={2.5} />
      </button>
      {/* Downward caret — points at the TeamFinderCard below */}
      <div className="tfhf-caret" />
    </>
  );

  if (isFloating) {
    return (
      /* Outer wrapper: handles fixed position + entrance slide */
      <div
        className="tfhf-wrapper"
        style={{ left: hintPos.left, width: hintPos.width }}
      >
        {/* Inner card: handles the continuous bob */}
        <div className="tfhf-card">
          {content}
        </div>
      </div>
    );
  }

  // Mobile / narrow viewport — inline at top of form
  return (
    <div className="tfhf-inline">
      <div className="tfhf-inline-card">
        {content}
      </div>
    </div>
  );
}

// ─── FormPreview ──────────────────────────────────────────────────────────────

export default function FormPreview() {
  const { formId } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [showHint, setShowHint] = useState(false);
  const [hintPos, setHintPos] = useState(null); // null = mobile/inline

  const asideRef = useRef(null);

  const safeFormId = useMemo(() => (formId && formId !== "undefined" ? formId : null), [formId]);

  const handleFindTeammates = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // On desktop (≥ 1360px) float above the aside; on narrower screens go inline
    if (typeof window !== 'undefined' && window.innerWidth >= 1360 && asideRef.current) {
      const rect = asideRef.current.getBoundingClientRect();
      // rect.left is viewport-relative — correct for position:fixed children
      setHintPos({ left: rect.left, width: rect.width });
    } else {
      setHintPos(null);
    }

    setShowHint(true);
  };

  const dismissHint = () => {
    setShowHint(false);
    setHintPos(null);
  };

  // LOAD FORM
  useEffect(() => {
    if (!safeFormId) return;
    setLoading(true);

    if (safeFormId.startsWith("draft_")) {
      const draft = getDraft(safeFormId);
      if (draft) { setFormData(draft); setLoading(false); return; }
    }

    fetch(`/api/forms/${safeFormId}`)
      .then((res) => { if (!res.ok) throw new Error("Form not found"); return res.json(); })
      .then((data) => { setFormData(data); setLoading(false); })
      .catch((err) => { console.error(err); setFormData(null); setLoading(false); });
  }, [safeFormId]);

  // CHECK IF USER ALREADY APPLIED
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
    if (safeFormId.startsWith("draft_")) { alert("Draft forms cannot be submitted"); return; }

    const missingRequired = (formData?.questions || []).filter((q) => q.required && !responses[q.id]);
    if (missingRequired && missingRequired.length > 0) { alert("Please fill in all required fields"); return; }

    const answers = { ...responses };
    if (formData?.isTeamEvent) {
      answers[TEAM_REGISTRATION_ANSWER_ID] =
        responses[TEAM_REGISTRATION_ANSWER_ID] || createDefaultTeamAnswer(formData.teamConfig);
    }

    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: safeFormId, answers }),
      });
      if (!res.ok) { const err = await res.json(); console.error("Submit Error:", err); alert(err.error || "Submission failed"); return; }
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleResponse = (questionId, value) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const current = responses[questionId] ?? [];
    const updated = checked ? [...current, option] : current.filter((o) => o !== option);
    handleResponse(questionId, updated);
  };

  if (loading) return (
    <div className="not-found-container"><p className="not-found-text">Loading form...</p></div>
  );

  if (!formData) return (
    <div className="not-found-container"><p className="not-found-text">Form not found</p></div>
  );

  if (submitted) return (
    <div className="success-container">
      <div className="success-inner">
        <div className="success-card">
          <div className="success-icon"><CheckCircle2 /></div>
          <h2 className="success-title">Response Submitted</h2>
          <p className="success-text">Thank you for completing the form. Your response has been recorded.</p>
          <Link href="/dashboard/events" className="btn-back-home">Back to Forms</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="form-preview-container">

      {/* Floating hint — rendered at root level so it escapes the grid */}
      {showHint && hintPos && (
        <TeamFinderHint hintPos={hintPos} onDismiss={dismissHint} />
      )}

      <div className="form-preview-content-shell">
        {/* Form */}
        <main className="form-preview-main">
          <form onSubmit={handleSubmit}>

            {/* Inline hint for mobile / narrow viewports */}
            {showHint && !hintPos && (
              <TeamFinderHint hintPos={null} onDismiss={dismissHint} />
            )}

            {/* Form Header */}
            <div className="form-preview-header-card">
              <div className="form-preview-accent"></div>
              <h1 className="form-preview-title">{formData.title}</h1>
              {formData.description && <p className="form-preview-description">{formData.description}</p>}
              {formData.genre && (
                <div className="form-genre-badge">
                  <Tag /><span>{formData.genre.replace('-', ' ')}</span>
                </div>
              )}
              {(formData.date || formData.time || formData.location) && (
                <div className="event-details-preview-section">
                  <h3 className="event-details-preview-title">Event Details</h3>
                  <div className="event-details-preview-grid">
                    {formData.date && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon"><CalendarIcon /></div>
                        <div className="event-detail-content">
                          <p className="event-detail-label">Date</p>
                          <p className="event-detail-value">{format(new Date(formData.date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    )}
                    {formData.time && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon"><Clock /></div>
                        <div className="event-detail-content">
                          <p className="event-detail-label">Time</p>
                          <p className="event-detail-value">{formData.time}</p>
                        </div>
                      </div>
                    )}
                    {formData.location && (
                      <div className="event-detail-item">
                        <div className="event-detail-icon"><MapPin /></div>
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

            {formData.isTeamEvent && (
              <div className="question-card">
                <div className="question-text-wrapper">
                  <h3 className="question-text">Team Registration</h3>
                </div>
                <TeamRegistrationCard
                  teamConfig={formData.teamConfig}
                  value={responses[TEAM_REGISTRATION_ANSWER_ID]}
                  onChange={(value) => handleResponse(TEAM_REGISTRATION_ANSWER_ID, value)}
                  onFindTeammates={handleFindTeammates}
                />
              </div>
            )}

            {/* Questions */}
            {(formData.questions || []).map((question) => (
              <div key={question.id} className="question-card">
                <div className="question-text-wrapper">
                  <h3 className="question-text">
                    {question.question}
                    {question.required && <span className="question-required">*</span>}
                  </h3>
                  {question.description && <p className="question-desc">{question.description}</p>}
                </div>

                {question.type === 'short' && (
                  <input type="text" value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-text" placeholder="Your answer" required={question.required} />
                )}
                {question.type === 'long' && (
                  <textarea value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-textarea" placeholder="Your answer" rows={4} required={question.required} />
                )}
                {question.type === 'email' && (
                  <input type="email" value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-text" placeholder="example@email.com" required={question.required} />
                )}
                {question.type === 'phone' && (
                  <input type="tel" value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-text" placeholder="(123) 456-7890" required={question.required} />
                )}
                {question.type === 'date' && (
                  <input type="date" value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-text" required={question.required} />
                )}
                {question.type === 'time' && (
                  <input type="time" value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="input-text" required={question.required} />
                )}
                {question.type === 'multiple' && (
                  <div className="radio-options">
                    {question.options?.map((option, index) => (
                      <label key={index} className="radio-option">
                        <input type="radio" name={question.id} value={option} checked={responses[question.id] === option} onChange={(e) => handleResponse(question.id, e.target.value)} required={question.required} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'checkbox' && (
                  <div className="checkbox-options">
                    {question.options?.map((option, index) => (
                      <label key={index} className="checkbox-option">
                        <input type="checkbox" checked={(responses[question.id] || []).includes(option)} onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)} />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'dropdown' && (
                  <select value={responses[question.id] || ''} onChange={(e) => handleResponse(question.id, e.target.value)} className="dropdown-select" required={question.required}>
                    <option value="">Choose</option>
                    {question.options?.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                )}
                {question.type === 'team' && (
                  <TeamRegistrationCard
                    teamConfig={question.teamConfig}
                    value={responses[question.id]}
                    onChange={(value) => handleResponse(question.id, value)}
                    onFindTeammates={handleFindTeammates}
                  />
                )}
              </div>
            ))}

            <button type="submit" className="btn-submit" disabled={alreadyApplied}>
              {alreadyApplied ? "Submitted" : "Submit"}
            </button>
          </form>
        </main>

        {/*
          On desktop the aside is sticky at top:32px.
          When the hint is floating, push the aside down so the hint floats above it cleanly.
          HINT_CARD_HEIGHT ≈ 80px + 8px top offset + 16px gap = 104px sticky top.
        */}
        <aside
          ref={asideRef}
          className="team-finder-preview-aside"
          style={showHint && hintPos ? { top: '108px', transition: 'top 0.4s cubic-bezier(0.22,1,0.36,1)' } : { transition: 'top 0.3s ease' }}
          aria-label="Find a team"
        >
          <TeamFinderCard />
        </aside>
      </div>
    </div>
  );
}
