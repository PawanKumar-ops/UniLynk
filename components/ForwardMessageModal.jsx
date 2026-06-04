import { useMemo, useState } from "react";
import { Check, Forward, Search } from "lucide-react";
import "./ForwardMessageModal.css";

function initials(name = "") {
  return (name || "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SimpleAvatar({ name, avatarUrl }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !avatarUrl || imgError;
  return (
    <div className="fwd-avatar">
      {showFallback ? (
        initials(name)
      ) : (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}

export function ForwardMessageModal({
  open,
  onOpenChange,
  message,
  recipients = [],
  onForward,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.communityName?.toLowerCase().includes(q) ||
        r.handle?.toLowerCase().includes(q) ||
        r.subtitle?.toLowerCase().includes(q),
    );
  }, [query, recipients]);

  const toggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleOpenChange = (next) => {
    if (!next) {
      setQuery("");
      setSelected([]);
      setSending(false);
    }
    onOpenChange(next);
  };

  const handleSend = async () => {
    if (selected.length === 0 || !message) return;
    try {
      setSending(true);
      await onForward?.(selected);
      handleOpenChange(false);
    } catch {
      // Keep modal open so the parent can surface the forwarding error
    } finally {
      setSending(false);
    }
  };

  const count = selected.length;

  if (!open) return null;

  return (
    <div className="fwd-backdrop" onClick={() => handleOpenChange(false)}>
      <div className="fwd-overlay" />

      <div className="fwd-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fwd-header">
          <h2 className="fwd-title">Forward message</h2>
          <p className="fwd-subtitle">Choose who to share this message with.</p>
        </div>

        {/* Search */}
        <div className="fwd-search-wrap">
          <div className="fwd-search-inner">
            <Search className="fwd-search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="fwd-search-input"
            />
          </div>
        </div>

        {/* Recipient list */}
        <div className="fwd-list">
          <div className="fwd-list-inner">
            {filtered.length === 0 ? (
              <div className="fwd-empty">
                <p className="fwd-empty-title">No matches</p>
                <p className="fwd-empty-sub">Try a different name.</p>
              </div>
            ) : (
              filtered.map((r) => {
                const isSelected = selected.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className="fwd-recipient-btn"
                  >
                    <SimpleAvatar name={r.name} avatarUrl={r.avatarUrl} />
                    <div className="fwd-info">
                      <p className="fwd-name">{r.name}</p>
                      <p className="fwd-meta">
                        {r.email || r.communityName || r.handle || r.subtitle}
                      </p>
                    </div>
                    <div
                      className={
                        isSelected
                          ? "fwd-checkbox fwd-checkbox--selected"
                          : "fwd-checkbox"
                      }
                    >
                      {isSelected && (
                        <Check className="fwd-check-icon" strokeWidth={3.5} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="fwd-actions">
          <button
            onClick={handleSend}
            disabled={count === 0 || sending}
            className="fwd-send-btn"
          >
            {sending
              ? "Sending…"
              : count === 0
              ? "Forward"
              : `Forward${count > 1 ? ` to ${count}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}