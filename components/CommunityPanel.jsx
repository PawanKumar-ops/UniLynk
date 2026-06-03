"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowLeft,
    Bell,
    Check,
    CheckCheck,
    Hash,
    Megaphone,
    MoreVertical,
    Plus,
    Search,
    Send,
    SmilePlus,
    Trash2,
    Users,
} from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import NewGroupModal from "./NewGroupModal";

function getDefaultGroupId(groups = []) {
    return groups.find((group) => group.isAnnouncement)?.id || groups[0]?.id || "";
}

function firstName(name = "") {
    return name.trim().split(/\s+/)[0] || "Member";
}

export default function CommunityPanel({ community, currentUserId, onBack, onGroupCreated }) {
    const groups = Array.isArray(community?.groups) ? community.groups : [];
    const members = Array.isArray(community?.members) ? community.members : [];
    const [activeGroupId, setActiveGroupId] = useState(() => getDefaultGroupId(groups));
    const [menuOpen, setMenuOpen] = useState(false);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [messagesByGroup, setMessagesByGroup] = useState({});
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState("");
    const [activeReactionPickerFor, setActiveReactionPickerFor] = useState("");
    const menuRef = useRef(null);
    const scrollRef = useRef(null);

    const activeGroup = useMemo(
        () => groups.find((group) => group.id === activeGroupId) || null,
        [groups, activeGroupId]
    );
    const activeMessages = activeGroupId ? messagesByGroup[activeGroupId] || [] : [];
    const canPostInActiveGroup = !!activeGroup && (!activeGroup.isAnnouncement || community.isAdmin);

    useEffect(() => {
        const fallbackGroupId = getDefaultGroupId(groups);
        if (!activeGroupId || !groups.some((group) => group.id === activeGroupId)) {
            setActiveGroupId(fallbackGroupId);
        }
    }, [groups, activeGroupId]);

    useEffect(() => {
        function onClick(event) {
            if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest(".chat-reaction-picker") || target.closest(".chat-bubble-action-btn")) return;
            setActiveReactionPickerFor("");
        }

        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    useEffect(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [activeGroupId, activeMessages.length]);

    useEffect(() => {
        if (!community?.id || !activeGroupId || messagesByGroup[activeGroupId]) return;

        let isMounted = true;
        async function loadGroupMessages() {
            try {
                setLoadingMessages(true);
                setError("");
                const response = await fetch(
                    `/api/communities/${community.id}/groups/${activeGroupId}/messages`,
                    { cache: "no-store" }
                );
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to load messages");
                if (!isMounted) return;
                setMessagesByGroup((prev) => ({ ...prev, [activeGroupId]: data.messages || [] }));
            } catch (err) {
                if (isMounted) setError(err.message || "Failed to load messages");
            } finally {
                if (isMounted) setLoadingMessages(false);
            }
        }

        loadGroupMessages();
        return () => {
            isMounted = false;
        };
    }, [community?.id, activeGroupId, messagesByGroup]);

    async function sendInGroup(event) {
        event.preventDefault();
        const trimmedDraft = draft.trim();
        if (!trimmedDraft || !activeGroupId || !canPostInActiveGroup) return;

        try {
            setError("");
            const response = await fetch(
                `/api/communities/${community.id}/groups/${activeGroupId}/messages`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: trimmedDraft }),
                }
            );
            const data = await response.json();
            if (!response.ok || !data?.ok) throw new Error(data.error || "Failed to send message");

            setMessagesByGroup((prev) => ({
                ...prev,
                [activeGroupId]: [...(prev[activeGroupId] || []), data.message],
            }));
            setDraft("");
        } catch (err) {
            setError(err.message || "Failed to send message");
        }
    }

    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

    function groupedReactions(reactions = []) {
        const map = reactions.reduce((acc, reaction) => {
            if (!reaction?.emoji) return acc;
            if (!acc[reaction.emoji]) acc[reaction.emoji] = 0;
            acc[reaction.emoji] += 1;
            return acc;
        }, {});
        return Object.entries(map);
    }

    function getMessageStatus(message) {
        if (message.readAt) return "read";
        if (message.deliveredAt || message.createdAt) return "delivered";
        return "sent";
    }

    function updateMessage(messageId, updater) {
        setMessagesByGroup((prev) => ({
            ...prev,
            [activeGroupId]: (prev[activeGroupId] || []).map((message) =>
                message.id === messageId ? updater(message) : message
            ),
        }));
    }

    async function handleToggleReaction(messageId, emoji) {
        if (!community?.id || !activeGroupId || !messageId || !emoji) return;
        try {
            setError("");
            const response = await fetch(`/api/communities/${community.id}/groups/${activeGroupId}/messages`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle-reaction", messageId, emoji }),
            });
            const data = await response.json();
            if (!response.ok || !data?.ok) throw new Error(data.error || "Failed to react to message");
            updateMessage(messageId, (message) => ({ ...message, reactions: data.reactions || [] }));
            setActiveReactionPickerFor("");
        } catch (err) {
            setError(err.message || "Failed to react to message");
        }
    }

    async function handleDeleteMessage(messageId, mode) {
        if (!community?.id || !activeGroupId || !messageId) return;
        try {
            setError("");
            const response = await fetch(`/api/communities/${community.id}/groups/${activeGroupId}/messages`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId, mode }),
            });
            const data = await response.json();
            if (!response.ok || !data?.ok) throw new Error(data.error || "Failed to delete message");
            setMessagesByGroup((prev) => ({
                ...prev,
                [activeGroupId]: (prev[activeGroupId] || []).filter((message) => message.id !== messageId),
            }));
            setActiveReactionPickerFor("");
        } catch (err) {
            setError(err.message || "Failed to delete message");
        }
    }

    async function handleCreateGroup({ name, description, memberIds }) {
        try {
            setError("");
            const response = await fetch(`/api/communities/${community.id}/groups`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, memberIds }),
            });
            const data = await response.json();
            if (!response.ok || !data?.ok) throw new Error(data.error || "Failed to create group");

            onGroupCreated?.(data.group);
            setMessagesByGroup((prev) => ({ ...prev, [data.group.id]: [] }));
            setActiveGroupId(data.group.id);
            setShowNewGroupModal(false);
        } catch (err) {
            setError(err.message || "Failed to create group");
        }
    }

    return (
        <div className="wa-community-wrap">
            <aside className="wa-community-rail">
                <header className="wa-community-rail-head">
                    <button className="wa-icon-btn" onClick={onBack} aria-label="Back">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="wa-community-card-avatar">
                        {community.image ? (
                            <ReliableImage src={community.image} fallbackSrc="/Profilepic.png" alt={community.name} width={56} height={56} />
                        ) : (
                            (community.name || "C")[0]?.toUpperCase()
                        )}
                    </div>
                    <div className="wa-community-rail-title">
                        <h3>{community.name}</h3>
                        <p>{community.memberCount} members</p>
                    </div>
                    <div className="wa-menu-wrap" ref={menuRef}>
                        <button className="wa-icon-btn" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Community menu">
                            <MoreVertical size={18} />
                        </button>
                        {menuOpen && (
                            <div className="wa-menu">
                                <button
                                    disabled={!community.isAdmin}
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
                            </div>
                        )}
                    </div>
                </header>

                {/* <div className="wa-community-card">
                    <div className="wa-community-card-avatar">
                        {community.image ? (
                            <ReliableImage src={community.image} fallbackSrc="/Profilepic.png" alt={community.name} width={56} height={56} />
                        ) : (
                            (community.name || "C")[0]?.toUpperCase()
                        )}
                    </div>
                    <div className="wa-community-card-body">
                        <strong>{community.name}</strong>
                        <span>{community.description || `Community by ${community.clubName || "Club"}`}</span>
                    </div>
                </div> */}

                <div className="wa-rail-section">
                    <div className="wa-rail-section-head">
                        <span>Groups</span>
                        {community.isAdmin && (
                            <button className="wa-link-btn" onClick={() => setShowNewGroupModal(true)} title="New group">
                                <Plus size={14} /> New
                            </button>
                        )}
                    </div>

                    <div className="wa-group-list">
                        {groups.map((group) => (
                            <button
                                key={group.id}
                                onClick={() => setActiveGroupId(group.id)}
                                className={`wa-group-row ${group.id === activeGroupId ? "active" : ""}`}
                            >
                                <div className={`wa-group-icon ${group.isAnnouncement ? "wa-group-icon-mega" : ""}`}>
                                    {group.isAnnouncement ? <Megaphone size={18} /> : <Hash size={18} />}
                                </div>
                                <div className="wa-group-info">
                                    <strong>{group.name}</strong>
                                    <span>{group.lastMessage || `${group.memberCount} members`}</span>
                                </div>
                            </button>
                        ))}
                        {!groups.length && <div className="wa-empty">No groups yet</div>}
                    </div>
                </div>

                <div className="wa-rail-section">
                    <div className="wa-rail-section-head">
                        <span>Members · {community.memberCount}</span>
                    </div>
                    <div className="wa-member-strip">
                        {members.slice(0, 6).map((member) => (
                            <div className="wa-member-strip-item" key={member.id}>
                                <div className="wa-avatar wa-avatar-sm">
                                    {member.image ? (
                                        <ReliableImage src={member.image} fallbackSrc="/Profilepic.png" alt={member.name} width={32} height={32} />
                                    ) : (
                                        (member.name || "?")[0]
                                    )}
                                </div>
                                <small>{firstName(member.name)}</small>
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

                        <div className="wa-chat-scroll" ref={scrollRef}>
                            {activeGroup.isAnnouncement && (
                                <div className="wa-banner">
                                    <Megaphone size={14} /> Only admins can send messages in Announcements.
                                </div>
                            )}
                            {error && <div className="wa-banner wa-banner-error">{error}</div>}
                            {loadingMessages ? (
                                <div className="wa-empty-state">
                                    <h3>Loading messages…</h3>
                                </div>
                            ) : activeMessages.length === 0 ? (
                                <div className="wa-empty-state">
                                    <div className="wa-empty-icon">
                                        {activeGroup.isAnnouncement ? <Megaphone size={28} /> : <Hash size={28} />}
                                    </div>
                                    <h3>Welcome to {activeGroup.name}</h3>
                                    <p>This is the start of the conversation. Say hi 👋</p>
                                </div>
                            ) : (
                                activeMessages.map((message) => {
                                    const own = message.senderId === currentUserId;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`wa-bubble-wrap chat-message-wrap-wrapper ${own ? "own chat-message-wrap-wrapper-own" : ""}`}
                                        >
                                            <div className={`wa-message-stack chat-message-wrap ${own ? "own chat-message-wrap-own" : ""}`}>
                                                <div
                                                    className={`wa-bubble chat-bubble ${own ? "own chat-bubble-own" : ""} ${activeReactionPickerFor === message.id ? "chat-bubble-menu-open" : ""}`}
                                                >
                                                    <div className="chat-bubble-actions" onClick={(event) => event.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="chat-bubble-action-btn"
                                                            onClick={() =>
                                                                setActiveReactionPickerFor((prev) => (prev === message.id ? "" : message.id))
                                                            }
                                                            aria-label="React to message"
                                                        >
                                                            <SmilePlus size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="chat-bubble-action-btn"
                                                            onClick={() =>
                                                                handleDeleteMessage(
                                                                    message.id,
                                                                    own || community.isAdmin ? "for-everyone" : "for-me"
                                                                )
                                                            }
                                                            aria-label={own || community.isAdmin ? "Delete for everyone" : "Delete for me"}
                                                        >
                                                            <Trash2 size={14} className={own || community.isAdmin ? "undo-svg" : ""} />
                                                        </button>

                                                        {activeReactionPickerFor === message.id ? (
                                                            <div className="chat-reaction-picker" onClick={(event) => event.stopPropagation()}>
                                                                {quickReactions.map((emoji) => (
                                                                    <button
                                                                        type="button"
                                                                        key={`${message.id}-${emoji}`}
                                                                        onClick={() => handleToggleReaction(message.id, emoji)}
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                    {!own && <span className="wa-bubble-author">{message.senderName}</span>}
                                                    <p>{message.text}</p>
                                                </div>
                                                <div className={`wa-bubble-footer chat-message-footer ${own ? "own chat-message-footer-own" : ""}`}>
                                                    {!own && (
                                                        <div className="wa-message-avatar chat-message-avatar">
                                                            {(message.senderName || "A")[0]?.toUpperCase() || "A"}
                                                        </div>
                                                    )}
                                                    <span className="chat-meta-row mt-1 text-xs text-neutral-400">
                                                        {new Date(message.createdAt).toLocaleTimeString([], {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                        })}
                                                        {own ? (
                                                            <em className={`chat-status chat-status-${getMessageStatus(message)}`}>
                                                                {getMessageStatus(message) === "sent" ? <Check size={13} /> : <CheckCheck size={13} />}
                                                            </em>
                                                        ) : null}
                                                    </span>
                                                </div>

                                                {!!(message.reactions || []).length && (
                                                    <div className="chat-reactions-row">
                                                        {groupedReactions(message.reactions).map(([emoji, count]) => (
                                                            <span key={`${message.id}-${emoji}`} className="chat-reaction-chip">
                                                                {emoji} {count}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <form className="wa-composer" onSubmit={sendInGroup}>
                            <input
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={canPostInActiveGroup ? `Message ${activeGroup.name}` : "Only admins can send messages"}
                                disabled={!canPostInActiveGroup}
                            />
                            <button type="submit" className="wa-send-btn" disabled={!draft.trim() || !canPostInActiveGroup}>
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
                    availableMembers={members.filter((member) => member.id !== currentUserId)}
                    onClose={() => setShowNewGroupModal(false)}
                    onCreate={handleCreateGroup}
                />
            )}
        </div>
    );
}
