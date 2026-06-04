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
    SmilePlus,
    Trash2,
    Undo2,
    Users,
} from "lucide-react";
import ReliableImage from "@/components/ReliableImage";
import NewGroupModal from "./NewGroupModal";
import { DeleteMessageModal } from "@/components/DeleteMessageModal";
import ChatComposer from "@/components/shared/ChatComposer";

function getDefaultGroupId(groups = []) {
    return groups.find((group) => group.isAnnouncement)?.id || groups[0]?.id || "";
}

function firstName(name = "") {
    return name.trim().split(/\s+/)[0] || "Member";
}

function mergeMessages(existingMessages = [], incomingMessages = []) {
    const messagesById = new Map();
    [...existingMessages, ...incomingMessages].forEach((message) => {
        if (!message?.id) return;
        messagesById.set(message.id, { ...messagesById.get(message.id), ...message });
    });

    return Array.from(messagesById.values()).sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
    });
}

export default function CommunityPanel({ community, currentUserId, socket, onBack, onGroupCreated, onForwardMessage }) {
    const groups = Array.isArray(community?.groups) ? community.groups : [];
    const members = Array.isArray(community?.members) ? community.members : [];
    const [activeGroupId, setActiveGroupId] = useState(() => getDefaultGroupId(groups));
    const [menuOpen, setMenuOpen] = useState(false);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [messagesByGroup, setMessagesByGroup] = useState({});
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState("");
    const [activeReactionPickerFor, setActiveReactionPickerFor] = useState("");
    const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const menuRef = useRef(null);
    const scrollRef = useRef(null);
    const latestFetchRef = useRef(0);

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
        if (!socket || !community?.id || !currentUserId) return;

        socket.emit("join-community", { communityId: community.id, userId: currentUserId }, (response) => {
            if (!response?.ok) {
                setError(response?.error || "Failed to join community chat");
            }
        });

        function handleIncomingCommunityMessage({ communityId, groupId, message }) {
            if (communityId !== community.id || !groupId || !message?.id) return;
            setMessagesByGroup((prev) => ({
                ...prev,
                [groupId]: mergeMessages(prev[groupId] || [], [message]),
            }));
        }

        function handleCommunityDeletion({ communityId, groupId, messageId, mode, userId, deletedForEveryone }) {
            if (communityId !== community.id || !groupId || !messageId) return;
            setMessagesByGroup((prev) => ({
                ...prev,
                [groupId]: (prev[groupId] || []).reduce((messages, message) => {
                    if (message.id !== messageId) return [...messages, message];
                    if (mode === "for-me" && userId === currentUserId) return messages;
                    if (mode === "for-everyone" || deletedForEveryone) {
                        return [...messages, { ...message, deletedForEveryone: true, text: "" }];
                    }
                    return [...messages, message];
                }, []),
            }));
            if (activeReactionPickerFor === messageId) setActiveReactionPickerFor("");
        }

        function handleCommunityReactions({ communityId, groupId, messageId, reactions }) {
            if (communityId !== community.id || !groupId || !messageId) return;
            setMessagesByGroup((prev) => ({
                ...prev,
                [groupId]: (prev[groupId] || []).map((message) =>
                    message.id === messageId ? { ...message, reactions: reactions || [] } : message
                ),
            }));
        }

        socket.on("new-community-message", handleIncomingCommunityMessage);
        socket.on("community-message-deleted", handleCommunityDeletion);
        socket.on("community-message-reactions-updated", handleCommunityReactions);

        return () => {
            socket.off("new-community-message", handleIncomingCommunityMessage);
            socket.off("community-message-deleted", handleCommunityDeletion);
            socket.off("community-message-reactions-updated", handleCommunityReactions);
        };
    }, [socket, community?.id, currentUserId]);

    useEffect(() => {
        if (!community?.id || !activeGroupId) return;

        const fetchId = latestFetchRef.current + 1;
        latestFetchRef.current = fetchId;
        const controller = new AbortController();

        async function loadGroupMessages() {
            try {
                setLoadingMessages(true);
                setError("");
                const response = await fetch(
                    `/api/communities/${community.id}/groups/${activeGroupId}/messages`,
                    { cache: "no-store", signal: controller.signal }
                );
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to load messages");
                if (latestFetchRef.current !== fetchId) return;
                setMessagesByGroup((prev) => ({
                    ...prev,
                    [activeGroupId]: mergeMessages(prev[activeGroupId] || [], data.messages || []),
                }));
            } catch (err) {
                if (err.name === "AbortError") return;
                if (latestFetchRef.current === fetchId) setError(err.message || "Failed to load messages");
            } finally {
                if (latestFetchRef.current === fetchId) setLoadingMessages(false);
            }
        }

        loadGroupMessages();
        return () => {
            controller.abort();
        };
    }, [community?.id, activeGroupId]);

    async function sendInGroup(payload) {
        if (!activeGroupId || !canPostInActiveGroup) return;

        const normalizedPayload = {
            ...payload,
            text: typeof payload?.text === "string" ? payload.text.trim() : "",
            messageType: payload?.messageType || "text",
        };
        if (normalizedPayload.messageType === "text" && !normalizedPayload.text) return;

        try {
            setError("");
            let data;
            if (socket?.connected) {
                data = await new Promise((resolve) => {
                    socket.emit(
                        "send-community-message",
                        {
                            communityId: community.id,
                            groupId: activeGroupId,
                            senderId: currentUserId,
                            ...normalizedPayload,
                        },
                        resolve
                    );
                });
            } else {
                const response = await fetch(
                    `/api/communities/${community.id}/groups/${activeGroupId}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(normalizedPayload),
                    }
                );
                data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to send message");
            }
            if (!data?.ok) throw new Error(data?.error || "Failed to send message");

            setMessagesByGroup((prev) => ({
                ...prev,
                [activeGroupId]: mergeMessages(prev[activeGroupId] || [], [data.message]),
            }));
        } catch (err) {
            setError(err.message || "Failed to send message");
            throw err;
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

    function updateMessage(messageId, updater, groupId = activeGroupId) {
        setMessagesByGroup((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || []).map((message) =>
                message.id === messageId ? updater(message) : message
            ),
        }));
    }

    async function handleToggleReaction(messageId, emoji) {
        if (!community?.id || !activeGroupId || !messageId || !emoji) return;
        try {
            setError("");
            let data;
            if (socket?.connected) {
                data = await new Promise((resolve) => {
                    socket.emit(
                        "toggle-community-reaction",
                        { communityId: community.id, groupId: activeGroupId, messageId, userId: currentUserId, emoji },
                        resolve
                    );
                });
            } else {
                const response = await fetch(`/api/communities/${community.id}/groups/${activeGroupId}/messages`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "toggle-reaction", messageId, emoji }),
                });
                data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to react to message");
            }
            if (!data?.ok) throw new Error(data?.error || "Failed to react to message");
            updateMessage(messageId, (message) => ({ ...message, reactions: data.reactions || [] }), data.groupId || activeGroupId);
            setActiveReactionPickerFor("");
        } catch (err) {
            setError(err.message || "Failed to react to message");
        }
    }

    function openDeleteMessageModal(message) {
        if (!message?.id) return;
        setDeleteTargetMessage(message);
        setDeleteModalOpen(true);
        setActiveReactionPickerFor("");
    }

    async function handleDeleteMessage(scope) {
        const messageId = deleteTargetMessage?.id;
        const mode = scope === "everyone" ? "for-everyone" : "for-me";
        if (!community?.id || !activeGroupId || !messageId) return;
        try {
            setError("");
            let data;
            if (socket?.connected) {
                data = await new Promise((resolve) => {
                    socket.emit(
                        "delete-community-message",
                        { communityId: community.id, groupId: activeGroupId, messageId, userId: currentUserId, mode },
                        resolve
                    );
                });
            } else {
                const response = await fetch(`/api/communities/${community.id}/groups/${activeGroupId}/messages`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messageId, mode }),
                });
                data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to delete message");
            }
            if (!data?.ok) throw new Error(data?.error || "Failed to delete message");
            setMessagesByGroup((prev) => ({
                ...prev,
                [activeGroupId]:
                    mode === "for-everyone"
                        ? (prev[activeGroupId] || []).map((message) =>
                            message.id === messageId ? { ...message, deletedForEveryone: true, text: "" } : message
                        )
                        : (prev[activeGroupId] || []).filter((message) => message.id !== messageId),
            }));
            setDeleteTargetMessage(null);
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

    function renderMessageContent(message) {
        if (message.deletedForEveryone) {
            return <p className="chat-text-message chat-deleted-placeholder">This message was deleted</p>;
        }

        if (message.messageType === "gif") {
            return <img src={message.text} alt="GIF" className="chat-gif" />;
        }

        if (message.messageType === "document" && message.attachment?.url) {
            return (
                <a href={message.attachment.url} target="_blank" rel="noreferrer" className="chat-document">
                    <span className="chat-document-file-icon">DOC</span>
                    <span>
                        <strong>{message.attachment.fileName || message.text || "Document"}</strong>
                    </span>
                </a>
            );
        }

        if (message.messageType === "media" && Array.isArray(message.attachments)) {
            return (
                <div className="chat-media-grid">
                    {message.attachments.map((media, index) => {
                        const isVideo = media.mimeType?.startsWith("video/");
                        return isVideo ? (
                            <video key={`${message.id}-media-${index}`} src={media.url} className="chat-media-video" controls />
                        ) : (
                            <img
                                key={`${message.id}-media-${index}`}
                                src={media.url}
                                className="chat-media-image"
                                alt={media.fileName || `Media ${index + 1}`}
                            />
                        );
                    })}
                    {message.text ? <p className="chat-text-message">{message.text}</p> : null}
                </div>
            );
        }

        if (message.messageType === "shared_post" && message.sharedPost?.id) {
            return (
                <div className="chat-shared-post-wrapper">
                    <div className="chat-shared-post-label">Shared post</div>
                    <a href={message.sharedPost.url || `/dashboard?post=${message.sharedPost.id}`} className="chat-shared-post-card">
                        <div className="chat-shared-post-head">
                            <div className="chat-shared-post-author-block">
                                <strong>{message.sharedPost.authorName || "UniLynk User"}</strong>
                            </div>
                        </div>
                        {message.sharedPost.content ? <p className="chat-shared-post-content">{message.sharedPost.content}</p> : null}
                    </a>
                </div>
            );
        }

        return <p>{message.text}</p>;
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
                                                        {!message.deletedForEveryone && (
                                                            <>
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
                                                                    onClick={() => {
                                                                        setActiveReactionPickerFor("");
                                                                        onForwardMessage?.({
                                                                            ...message,
                                                                            sender: message.senderId,
                                                                            communityId: community.id,
                                                                            groupId: activeGroupId,
                                                                        });
                                                                    }}
                                                                    aria-label="Forward message"
                                                                >
                                                                    <Undo2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="chat-bubble-action-btn"
                                                            onClick={() => openDeleteMessageModal(message)}
                                                            aria-label={own ? "Delete message" : "Delete for me"}
                                                        >
                                                            <Trash2 size={14} className={own ? "undo-svg" : ""} />
                                                        </button>

                                                        {!message.deletedForEveryone && activeReactionPickerFor === message.id ? (
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
                                                    {renderMessageContent(message)}
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

                                                {!message.deletedForEveryone && !!(message.reactions || []).length && (
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

                        <ChatComposer
                            disabled={!canPostInActiveGroup}
                            placeholder={`Message ${activeGroup.name}`}
                            disabledPlaceholder="Only admins can send messages"
                            onSend={sendInGroup}
                            onError={setError}
                        />
                    </>
                ) : (
                    <div className="wa-empty-state wa-empty-state-full">
                        <h3>Select a group</h3>
                        <p>Choose a group from the left to start chatting.</p>
                    </div>
                )}
            </section>

            <DeleteMessageModal
                open={deleteModalOpen}
                onOpenChange={(open) => {
                    setDeleteModalOpen(open);
                    if (!open) setDeleteTargetMessage(null);
                }}
                onConfirm={handleDeleteMessage}
                canDeleteForEveryone={deleteTargetMessage?.senderId === currentUserId}
            />

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
