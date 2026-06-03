// components/CommunityPanel.jsx  (save as .jsx in your project)
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Hash,
  Megaphone,
  MoreVertical,
  Plus,
  Search,
  Send,
  Users,
} from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import NewGroupModal from "./NewGroupModal";

export default function CommunityPanel({
  community,
  currentUserId,
  onBack,
  onGroupCreated,
}) {
  const [activeGroupId, setActiveGroupId] = useState(
    community.groups.find((g) => g.isAnnouncement)?.id || community.groups[0]?.id || ""
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [messages, setMessages] = useState({});
  const [draft, setDraft] = useState("");
  const menuRef = useRef(null);

  const activeGroup = useMemo(
    () => community.groups.find((g) => g.id === activeGroupId),
    [community.groups, activeGroupId]
  );

  useEffect(() => {
    function onClick(e) {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function sendInGroup(e) {
    e.preventDefault();
    if (!draft.trim() || !activeGroupId) return;
    const me = community.members.find((m) => m.id === currentUserId);
    setMessages((prev) => ({
      ...prev,
      [activeGroupId]: [
        ...(prev[activeGroupId] || []),
        {
          id: `${Date.now()}`,
          senderId: currentUserId,
          senderName: me?.name || "You",
          text: draft.trim(),
          createdAt: Date.now(),
        },
      ],
    }));
    setDraft("");
  }

  async function handleCreateGroup({ name, description, memberIds }) {
    const res = await fetch(`/api/communities/${community.id}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, memberIds }),
    });
    const data = await res.json();
    if (data?.ok && data.group) {
      onGroupCreated?.(data.group);
      setActiveGroupId(data.group.id);
    }
    setShowNewGroupModal(false);
  }

  return (
    <div className="wa-community-wrap">
      <aside className="wa-community-rail">
        <header className="wa-community-rail-head">
          <button className="wa-icon-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="wa-community-rail-title">
            <h3>{community.name}</h3>
            <p>{community.memberCount} members</p>
          </div>
          <div className="wa-menu-wrap" ref={menuRef}>
            <button
              className="wa-icon-btn"
              onClick={() => setMenuOpen((p) => !p)}
              aria-label="Community menu"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="wa-menu">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowNewGroupModal(true);
                  }}
                >
                  <Plus size={14} /> New group
                </button>
                <button onClick={() => setMenuOpen(false)}>
                  <Users size={14} /> View members
                </button>
                <button onClick={() => setMenuOpen(false)}>
                  <Bell size={14} /> Notifications
                </button>
                <button onClick={() => setMenuOpen(false)}>Community info</button>
                <button onClick={() => setMenuOpen(false)} className="wa-menu-danger">
                  Exit community
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="wa-community-card">
          <div className="wa-community-card-avatar">
            {community.image ? (
              <ReliableImage
                src={community.image}
                fallbackSrc="/Profilepic.png"
                alt={community.name}
                width={56}
                height={56}
              />
            ) : (
              (community.name || "C")[0]?.toUpperCase()
            )}
          </div>
          <div className="wa-community-card-body">
            <strong>{community.name}</strong>
            <span>{community.description || `Community by ${community.clubName || "Club"}`}</span>
          </div>
        </div>

        <div className="wa-rail-section">
          <div className="wa-rail-section-head">
            <span>Groups</span>
            <button
              className="wa-link-btn"
              onClick={() => setShowNewGroupModal(true)}
              title="New group"
            >
              <Plus size={14} /> New
            </button>
          </div>

          <div className="wa-group-list">
            {community.groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`wa-group-row ${g.id === activeGroupId ? "active" : ""}`}
              >
                <div className={`wa-group-icon ${g.isAnnouncement ? "wa-group-icon-mega" : ""}`}>
                  {g.isAnnouncement ? <Megaphone size={18} /> : <Hash size={18} />}
                </div>
                <div className="wa-group-info">
                  <strong>{g.name}</strong>
                  <span>{g.memberCount} members</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="wa-rail-section">
          <div className="wa-rail-section-head">
            <span>Members · {community.memberCount}</span>
          </div>
          <div className="wa-member-strip">
            {community.members.slice(0, 6).map((m) => (
              <div className="wa-member-strip-item" key={m.id}>
                <div className="wa-avatar wa-avatar-sm">
                  {m.image ? (
                    <ReliableImage
                      src={m.image}
                      fallbackSrc="/Profilepic.png"
                      alt={m.name}
                      width={32}
                      height={32}
                    />
                  ) : (
                    (m.name || "?")[0]
                  )}
                </div>
                <small>{m.name.split(" ")[0]}</small>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <section className="wa-community-chat">
        {activeGroup ? (
          <>
            <header className="wa-chat-head">
              <div className={`wa-group-icon ${activeGroup.isAnnouncement ? "wa-group-icon-mega" : ""}`}>
                {activeGroup.isAnnouncement ? <Megaphone size={18} /> : <Hash size={18} />}
              </div>
              <div className="wa-chat-head-info">
                <h2>{activeGroup.name}</h2>
                <p>
                  {activeGroup.memberCount} members
                  {activeGroup.description ? ` · ${activeGroup.description}` : ""}
                </p>
              </div>
              <button className="wa-icon-btn" aria-label="Search messages">
                <Search size={16} />
              </button>
              <button className="wa-icon-btn" aria-label="More options">
                <MoreVertical size={16} />
              </button>
            </header>

            <div className="wa-chat-scroll">
              {activeGroup.isAnnouncement && (
                <div className="wa-banner">
                  <Megaphone size={14} /> Only admins can send messages in Announcements.
                </div>
              )}
              {(messages[activeGroup.id] || []).length === 0 ? (
                <div className="wa-empty-state">
                  <div className="wa-empty-icon">
                    {activeGroup.isAnnouncement ? <Megaphone size={28} /> : <Hash size={28} />}
                  </div>
                  <h3>Welcome to {activeGroup.name}</h3>
                  <p>This is the start of the conversation. Say hi 👋</p>
                </div>
              ) : (
                (messages[activeGroup.id] || []).map((msg) => {
                  const own = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`wa-bubble-wrap ${own ? "own" : ""}`}>
                      <div className={`wa-bubble ${own ? "own" : ""}`}>
                        {!own && <span className="wa-bubble-author">{msg.senderName}</span>}
                        <p>{msg.text}</p>
                        <small>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form className="wa-composer" onSubmit={sendInGroup}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  activeGroup.isAnnouncement && !community.isAdmin
                    ? "Only admins can send messages"
                    : `Message ${activeGroup.name}`
                }
                disabled={activeGroup.isAnnouncement && !community.isAdmin}
              />
              <button type="submit" className="wa-send-btn" disabled={!draft.trim()}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="wa-empty-state wa-empty-state-full">
            <h3>Select a group</h3>
            <p>Choose a group from the left to start chatting.</p>
          </div>
        )}
      </section>

      {showNewGroupModal && (
        <NewGroupModal
          communityName={community.name}
          availableMembers={community.members.filter((m) => m.id !== currentUserId)}
          onClose={() => setShowNewGroupModal(false)}
          onCreate={handleCreateGroup}
        />
      )}
    </div>
  );
}
