// components/NewGroupModal.jsx  (save as .jsx in your project)
"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Camera, Check, Search, X } from "lucide-react";
import ReliableImage from "@/components/ReliableImage";

export default function NewGroupModal({
  communityName,
  availableMembers,
  onClose,
  onCreate,
}) {
  const [step, setStep] = useState("members");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return availableMembers;
    return availableMembers.filter((m) => m.name?.toLowerCase().includes(q));
  }, [availableMembers, search]);

  const selectedMembers = availableMembers.filter((m) => selected.includes(m.id));

  function toggle(id) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), memberIds: selected });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="wa-modal-backdrop" onClick={onClose}>
      <div className="wa-modal" onClick={(e) => e.stopPropagation()}>
        <header className="wa-modal-head">
          <button
            className="wa-icon-btn"
            onClick={step === "details" ? () => setStep("members") : onClose}
          >
            {step === "details" ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
          <div className="wa-modal-title">
            <h3>{step === "members" ? "Add group members" : "New group"}</h3>
            <p>
              {step === "members"
                ? `${selected.length} of ${availableMembers.length} selected`
                : `For "${communityName}"`}
            </p>
          </div>
        </header>

        {step === "members" ? (
          <>
            {!!selected.length && (
              <div className="wa-chips">
                {selectedMembers.map((m) => (
                  <span className="wa-chip" key={m.id}>
                    <span className="wa-chip-avatar">
                      {m.image ? (
                        <ReliableImage src={m.image} fallbackSrc="/Profilepic.png" alt={m.name} width={24} height={24} />
                      ) : (
                        (m.name || "?")[0]
                      )}
                    </span>
                    {m.name}
                    <button onClick={() => toggle(m.id)} aria-label="Remove">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="wa-search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name"
              />
            </div>

            <div className="wa-member-list">
              {filtered.map((m) => {
                const isSel = selected.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={`wa-member-row ${isSel ? "selected" : ""}`}
                    onClick={() => toggle(m.id)}
                  >
                    <div className="wa-avatar wa-avatar-md">
                      {m.image ? (
                        <ReliableImage src={m.image} fallbackSrc="/Profilepic.png" alt={m.name} width={42} height={42} />
                      ) : (
                        (m.name || "?")[0]?.toUpperCase()
                      )}
                      {isSel && (
                        <span className="wa-check-badge">
                          <Check size={12} />
                        </span>
                      )}
                    </div>
                    <div className="wa-member-info">
                      <strong>{m.name}</strong>
                      <span>{m.email || "Tap to add"}</span>
                    </div>
                  </button>
                );
              })}
              {!filtered.length && <div className="wa-empty">No members found</div>}
            </div>

            <div className="wa-modal-foot">
              <button
                className="wa-fab-next"
                disabled={!selected.length}
                onClick={() => setStep("details")}
              >
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="wa-group-details">
              <div className="wa-group-photo">
                <Camera size={22} />
                <span>Add group icon</span>
              </div>

              <div className="wa-input-wrap">
                <label>Group name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group subject"
                  maxLength={60}
                  autoFocus
                />
                <small>{60 - name.length}</small>
              </div>

              <div className="wa-input-wrap">
                <label>Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description"
                  rows={3}
                />
              </div>

              <div className="wa-group-members-preview">
                <h4>Members · {selected.length}</h4>
                <div className="wa-chips wa-chips-row">
                  {selectedMembers.map((m) => (
                    <span className="wa-chip" key={m.id}>
                      <span className="wa-chip-avatar">
                        {m.image ? (
                          <ReliableImage src={m.image} fallbackSrc="/Profilepic.png" alt={m.name} width={24} height={24} />
                        ) : (
                          (m.name || "?")[0]
                        )}
                      </span>
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="wa-modal-foot">
              <button
                className="wa-fab-next"
                disabled={!name.trim() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Creating..." : "Create group"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
