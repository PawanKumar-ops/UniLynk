"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  Check,
  CheckCheck,
  FileText,
  Search,
  MoreVertical,
  SmilePlus,
  Trash2,
  Ban,
  Users,
} from "lucide-react";
import "./chat.css";
import ReliableImage from "@/components/ReliableImage";
import ChatComposer from "@/components/shared/ChatComposer";
import CommunityPanel from "@/components/CommunityPanel";
import { DeleteMessageModal } from "@/components/DeleteMessageModal";
import { ForwardMessageModal } from "@/components/ForwardMessageModal";
import { BlockedModal } from "@/components/BlockedModal";

function formatChatTimestamp(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatPostMetaDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(size = 0) {
  if (!size) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function ChatPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // sidebar filter
  const [showSearch, setShowSearch] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState(""); // chat messages search
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeReactionPickerFor, setActiveReactionPickerFor] = useState("");
  const [forwardTargetMessage, setForwardTargetMessage] = useState(null);
  const [chatSocket, setChatSocket] = useState(null);
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [composerDraft, setComposerDraft] = useState({ key: "", text: "", media: [] });

  // ---------- Community state ----------
  const [communities, setCommunities] = useState([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [activeCommunityId, setActiveCommunityId] = useState("");

  const socketRef = useRef(null);
  const messageScrollRef = useRef(null);
  const activeUserIdRef = useRef("");
  const currentUserIdRef = useRef("");
  const menuRef = useRef(null);
  const chatSearchRef = useRef(null);

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId),
    [users, activeUserId]
  );

  const activeCommunity = useMemo(
    () => communities.find((c) => c.id === activeCommunityId) || null,
    [communities, activeCommunityId]
  );

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!messageScrollRef.current) return;
    messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!activeReactionPickerFor) return;
    const handleOutsideReactionPickerClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".chat-reaction-picker") || target.closest(".chat-bubble-action-btn")) return;
      setActiveReactionPickerFor("");
    };
    document.addEventListener("mousedown", handleOutsideReactionPickerClick);
    document.addEventListener("touchstart", handleOutsideReactionPickerClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideReactionPickerClick);
      document.removeEventListener("touchstart", handleOutsideReactionPickerClick);
    };
  }, [activeReactionPickerFor]);


  function sendSocketMessage(payload) {
    return new Promise((resolve, reject) => {
      if (!activeUserId || !currentUserId || !socketRef.current) {
        const message = "Select a user and wait for chat connection";
        setError(message);
        reject(new Error(message));
        return;
      }
      socketRef.current.emit(
        "send-message",
        { senderId: currentUserId, receiverId: activeUserId, ...payload },
        (response) => {
          if (!response?.ok) {
            const message = response?.error || "Failed to send message";
            setError(message);
            reject(new Error(message));
            return;
          }
          if (response?.message) {
            setMessages((prev) => {
              const exists = prev.some((msg) => msg.id === response.message.id);
              if (exists) return prev;
              return [...prev, response.message];
            });
          }
          setError("");
          resolve(response?.message);
        }
      );
    });
  }


  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/chat/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data.users || []);
      setCurrentUserId(data.currentUserId || "");
      setBlockedUsers(data.blockedUsers || []);
      setBlockedBy(data.blockedBy || []);
      if ((data.users || []).length > 0) {
        setActiveUserId((prev) => prev || data.users[0].id);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadCommunities() {
    try {
      setLoadingCommunities(true);
      const res = await fetch("/api/communities", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load communities");
      setCommunities(data.communities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommunities(false);
    }
  }

  async function loadMessages(userId) {
    if (!userId) return;
    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/chat/messages?userId=${userId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load messages");
      setMessages(data.messages || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }



  useEffect(() => {
    loadUsers();
    loadCommunities();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get("userId") || "";
    const draftText = params.get("text") || "";
    const mediaUrl = params.get("mediaUrl") || "";

    if (!targetUserId) return;

    setActiveCommunityId("");
    setActiveUserId(targetUserId);

    if (draftText || mediaUrl) {
      setComposerDraft({
        key: `${targetUserId}-${draftText}-${mediaUrl}`,
        text: draftText,
        media: mediaUrl
          ? [
              {
                url: mediaUrl,
                fileName: params.get("mediaName") || "Newsletter image",
                mimeType: params.get("mediaType") || "image/*",
              },
            ]
          : [],
      });
    }
  }, []);

  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }
    loadMessages(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (!messages.length || !activeUserId || !currentUserId) return;
    const hasUnreadIncoming = messages.some(
      (msg) => msg.sender === activeUserId && msg.receiver === currentUserId && !msg.readAt
    );
    if (hasUnreadIncoming) markActiveThreadAsRead();
  }, [messages, activeUserId, currentUserId]);

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
    if (!currentUserId) return;
    let isMounted = true;

    async function initSocket() {
      try {
        await fetch("/api/socket", { method: "GET" });
        if (!isMounted) return;
        const socket = io({ path: "/api/socket_io" });
        socketRef.current = socket;
        setChatSocket(socket);

        socket.on("connect", () => socket.emit("register-user", currentUserId));

        socket.on("user-blocked-state-changed", ({ blockerId, blockedId, action }) => {
          const signedInUserId = currentUserIdRef.current;
          if (blockerId === signedInUserId) {
            setBlockedUsers((prev) => {
              if (action === "block") {
                return prev.includes(blockedId) ? prev : [...prev, blockedId];
              } else {
                return prev.filter((id) => id !== blockedId);
              }
            });
          }
          if (blockedId === signedInUserId) {
            setBlockedBy((prev) => {
              if (action === "block") {
                return prev.includes(blockerId) ? prev : [...prev, blockerId];
              } else {
                return prev.filter((id) => id !== blockerId);
              }
            });
          }
        });

        socket.on("new-message", (incomingMessage) => {
          const openUserId = activeUserIdRef.current;
          const signedInUserId = currentUserIdRef.current;
          const isInOpenThread =
            (incomingMessage.sender === openUserId && incomingMessage.receiver === signedInUserId) ||
            (incomingMessage.sender === signedInUserId && incomingMessage.receiver === openUserId);
          if (!isInOpenThread) return;
          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === incomingMessage.id);
            if (exists) return prev;
            return [...prev, incomingMessage];
          });
        });

        socket.on("messages-read", ({ byUserId, peerUserId, readAt }) => {
          const openUserId = activeUserIdRef.current;
          const signedInUserId = currentUserIdRef.current;
          if (!readAt || !signedInUserId || !openUserId) return;
          const affectsOpenThread =
            (byUserId === signedInUserId && peerUserId === openUserId) ||
            (byUserId === openUserId && peerUserId === signedInUserId);
          if (!affectsOpenThread) return;
          setMessages((prev) =>
            prev.map((msg) => {
              const isIncoming = msg.sender === peerUserId && msg.receiver === byUserId;
              if (!isIncoming || msg.readAt) return msg;
              return { ...msg, deliveredAt: readAt, readAt };
            })
          );
        });

        socket.on("message-reactions-updated", ({ messageId, reactions }) => {
          if (!messageId) return;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, reactions: reactions || [] } : msg))
          );
        });

        socket.on("message-deleted", ({ messageId, mode, userId, deletedForEveryone }) => {
          if (!messageId) return;
          setMessages((prev) => {
            // Delete-for-me events are emitted only to the affected user and should remove
            // the message from that user's open window. Delete-for-everyone keeps the row
            // and swaps the content for the shared placeholder.
            if (mode === "for-me" && userId === currentUserIdRef.current) return prev.filter((msg) => msg.id !== messageId);
            if (mode === "for-everyone" || deletedForEveryone) {
              return prev.map((msg) =>
                msg.id === messageId ? { ...msg, deletedForEveryone: true, text: "" } : msg
              );
            }
            return prev;
          });
          if ((mode === "for-me" || deletedForEveryone) && forwardTargetMessage?.id === messageId) closeForwardModal();
          if (activeReactionPickerFor === messageId) setActiveReactionPickerFor("");
        });
      } catch (err) {
        setError(err.message || "Failed to connect socket");
      }
    }

    initSocket();
    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUserId]);

  const conversations = useMemo(
    () =>
      users.map((u) => {
        const normalizedRole = (u.role || "").toLowerCase().trim();
        let category = "direct";
        if (normalizedRole === "student") category = "student";
        else if (normalizedRole === "club") category = "club";
        return {
          id: u.id,
          name: u.name,
          avatar: u.name?.[0]?.toUpperCase(),
          image: u.image || "",
          preview: u.lastMessage || u.email,
          time: "",
          unread: u.unreadCount || 0,
          category,
          kind: "user",
        };
      }),
    [users]
  );

  const communityItems = useMemo(
    () =>
      communities.map((c) => ({
        id: `community-${c.id}`,
        rawId: c.id,
        name: c.name,
        avatar: c.name?.[0]?.toUpperCase(),
        image: c.image || "",
        preview: c.description || `${c.memberCount} members`,
        time: "",
        unread: 0,
        category: "club",
        kind: "community",
      })),
    [communities]
  );

  const filters = [
    { label: "All Chats", value: "all" },
    { label: "Clubs", value: "club" },
    { label: "Students", value: "student" },
  ];

  function markActiveThreadAsRead() {
    if (!socketRef.current || !currentUserId || !activeUserId) return;
    socketRef.current.emit("mark-messages-read", { currentUserId, otherUserId: activeUserId });
  }

  function getMessageStatus(message) {
    if (message.readAt) return "read";
    if (message.deliveredAt) return "delivered";
    return "sent";
  }

  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  function handleToggleReaction(messageId, emoji) {
    if (!socketRef.current || !currentUserId || !messageId || !emoji) return;
    socketRef.current.emit(
      "toggle-reaction",
      { messageId, userId: currentUserId, emoji },
      (response) => {
        if (!response?.ok) {
          setError(response?.error || "Failed to react to message");
          return;
        }
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? { ...msg, reactions: response.reactions || [] } : msg))
        );
        setActiveReactionPickerFor("");
      }
    );
  }

  function openForwardModal(message) {
    if (!message?.id) return;
    setForwardTargetMessage(message);
    setError("");
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
    if (!currentUserId || !messageId) return;

    const applyDeleteResult = () => {
      setMessages((prev) =>
        mode === "for-everyone"
          ? prev.map((msg) => (msg.id === messageId ? { ...msg, deletedForEveryone: true, text: "" } : msg))
          : prev.filter((msg) => msg.id !== messageId)
      );
      setError("");
      setDeleteTargetMessage(null);
      if (forwardTargetMessage?.id === messageId) closeForwardModal();
      if (activeReactionPickerFor === messageId) setActiveReactionPickerFor("");
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "delete-message",
        { messageId, userId: currentUserId, mode },
        (response) => {
          if (!response?.ok) {
            setError(response?.error || "Failed to delete message");
            return;
          }
          applyDeleteResult();
        }
      );
      return;
    }

    try {
      const endpoint = mode === "for-everyone" ? "delete-for-everyone" : "delete-for-me";
      const response = await fetch(`/api/chat/messages/${messageId}/${endpoint}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data.error || "Failed to delete message");
      applyDeleteResult();
    } catch (err) {
      setError(err.message || "Failed to delete message");
    }
  }

  function closeForwardModal() {
    setForwardTargetMessage(null);
  }

  function emitForwardMessage(payload, targetId) {
    return new Promise((resolve) => {
      if (targetId?.startsWith("community:")) {
        socketRef.current.emit("send-community-message", payload, (response) => resolve(response));
        return;
      }
      socketRef.current.emit("send-message", payload, (response) => resolve(response));
    });
  }

  async function handleForwardMessage(selectedTargetIds = []) {
    if (!socketRef.current || !currentUserId || !forwardTargetMessage?.id) {
      const message = "Wait for chat connection before forwarding this message";
      setError(message);
      throw new Error(message);
    }
    if (!selectedTargetIds.length) {
      const message = "Please select at least one recipient to forward this message";
      setError(message);
      throw new Error(message);
    }
    const payload = {
      senderId: currentUserId,
      text: forwardTargetMessage.text || "",
      messageType: forwardTargetMessage.messageType || "text",
    };
    if (forwardTargetMessage.messageType === "document" && forwardTargetMessage.attachment?.url) {
      payload.attachment = forwardTargetMessage.attachment;
    }
    if (forwardTargetMessage.messageType === "media" && Array.isArray(forwardTargetMessage.attachments)) {
      payload.attachments = forwardTargetMessage.attachments;
    }
    if (forwardTargetMessage.messageType === "shared_post" && forwardTargetMessage.sharedPost?.id) {
      payload.sharedPost = forwardTargetMessage.sharedPost;
    }
    const responses = await Promise.all(
      selectedTargetIds.map((targetId) => {
        if (targetId.startsWith("community:")) {
          const [, communityId, groupId] = targetId.split(":");
          return emitForwardMessage({ ...payload, communityId, groupId }, targetId);
        }
        return emitForwardMessage({ ...payload, receiverId: targetId }, targetId);
      })
    );
    const failedResponses = responses.filter((r) => !r?.ok);
    responses.forEach((response) => {
      if (!response?.ok || !response.message || !response.message.sender || !response.message.receiver) return;
      const isInOpenThread =
        (response.message.sender === activeUserId && response.message.receiver === currentUserId) ||
        (response.message.sender === currentUserId && response.message.receiver === activeUserId);
      if (!isInOpenThread) return;
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === response.message.id);
        if (exists) return prev;
        return [...prev, response.message];
      });
    });
    if (failedResponses.length) {
      const message = failedResponses[0]?.error || "Failed to forward message to some recipients";
      setError(message);
      throw new Error(message);
    }
    setError("");
  }

  function groupedReactions(reactions = []) {
    const map = reactions.reduce((acc, reaction) => {
      if (!reaction?.emoji) return acc;
      if (!acc[reaction.emoji]) acc[reaction.emoji] = 0;
      acc[reaction.emoji] += 1;
      return acc;
    }, {});
    return Object.entries(map);
  }

  const filteredConversations = useMemo(() => {
    const includeCommunities = activeFilter === "all" || activeFilter === "club";
    const base = includeCommunities ? [...communityItems, ...conversations] : conversations;
    return base.filter((c) => {
      const bySearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const byFilter = activeFilter === "all" || c.category === activeFilter;
      return bySearch && byFilter;
    });
  }, [conversations, communityItems, searchTerm, activeFilter]);

  // Filter messages based on search term
  const filteredMessages = useMemo(() => {
    if (!chatSearchTerm) return messages;
    const term = chatSearchTerm.toLowerCase();
    return messages.filter((msg) => {
      const text = msg.text?.toString().toLowerCase() || "";
      return text.includes(term);
    });
  }, [messages, chatSearchTerm]);

  const forwardingTargetItems = useMemo(() => {
    const directTargets = users
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        id: user.id,
        name: user.name || user.email || "UniLynk User",
        email: user.email || "",
        subtitle: user.email || "Direct message",
        avatarUrl: user.image || "",
        kind: "dm",
      }));

    const communityTargets = communities.flatMap((community) =>
      (community.groups || []).map((group) => ({
        id: `community:${community.id}:${group.id}`,
        name: group.name || community.name,
        communityName: community.name,
        subtitle: `${community.name} community`,
        avatarUrl: group.image || community.image || "",
        kind: "community",
      }))
    );

    return [...directTargets, ...communityTargets];
  }, [users, communities, currentUserId]);

  function handleSelectChatItem(item) {
    if (item.kind === "community") {
      setActiveCommunityId(item.rawId);
      return;
    }

    setActiveCommunityId("");
    setActiveUserId(item.id);
  }

  function handleBackFromCommunity() {
    setActiveCommunityId("");
    setActiveReactionPickerFor("");
    closeForwardModal();

    if (!activeUserId) {
      const fallbackUserId = users.find((user) => user.id !== currentUserId)?.id || users[0]?.id || "";
      setActiveUserId(fallbackUserId);
    }
  }


  function handleGroupCreatedInCommunity(group) {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === activeCommunityId ? { ...c, groups: [...c.groups, group] } : c
      )
    );
  }

  useEffect(() => {
    if (activeUserId && blockedBy.includes(activeUserId)) {
      setShowBlockedModal(true);
    } else {
      setShowBlockedModal(false);
    }
  }, [activeUserId, blockedBy]);

  async function handleToggleBlock(targetUserId, action) {
    setMenuOpen(false);
    if (!targetUserId) return;

    const applyBlockResult = (updatedBlockedUsers) => {
      setBlockedUsers(updatedBlockedUsers);
      setError("");
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        "block-user",
        { targetUserId, action },
        (response) => {
          if (!response?.ok) {
            setError(response?.error || "Failed to toggle block status");
            return;
          }
          applyBlockResult(response.blockedUsers || []);
        }
      );
      return;
    }

    try {
      const response = await fetch("/api/chat/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to toggle block status");
      applyBlockResult(data.blockedUsers || []);
    } catch (err) {
      setError(err.message || "Failed to toggle block status");
    }
  }

  return (
    <div className={`chat-page ${activeCommunity ? "chat-page-community-mode" : ""}`}>
      {activeCommunity ? (
        <CommunityPanel
          community={activeCommunity}
          currentUserId={currentUserId}
          socket={chatSocket}
          onBack={handleBackFromCommunity}
          onGroupCreated={handleGroupCreatedInCommunity}
          onForwardMessage={openForwardModal}
        />
      ) : (
        <>
          <main className="chat-main-panel" style={{ position: "relative" }}>
            <header className="wa-chat-head">
              {activeUser ? (
                <>
                  <div className="wa-group-icon wa-group-icon-mega">
                    <ReliableImage
                      src={activeUser.image}
                      fallbackSrc="/Profilepic.png"
                      alt={activeUser.name}
                      width={46}
                      height={46}
                    />
                  </div>

                  <div className="wa-chat-head-info">
                    <h2>{activeUser.name}</h2>
                    {!showSearch && <p>{activeUser.email}</p>}
                  </div>

                  <div
  className={`chat-search-wrapper ${showSearch ? "open" : ""}`}
  onClick={() => {
    if (!showSearch) {
      setShowSearch(true);
      setTimeout(() => chatSearchRef.current?.focus(), 0);
    }
  }}
>
  <Search className="chat-search-icon" size={16} />

  {showSearch && (
    <input
      ref={chatSearchRef}
      type="text"
      placeholder="Search students, clubs, events..."
      value={chatSearchTerm}
      onChange={(e) => setChatSearchTerm(e.target.value)}
      className="chat-text-search-input"
      onBlur={() => {
        if (!chatSearchTerm) setShowSearch(false);
      }}
    />
  )}
</div>

                  <div className="wa-menu-wrap" ref={menuRef}>
                    <button
                      className="wa-icon-btn"
                      onClick={() => setMenuOpen((prev) => !prev)}
                      aria-label="Community menu"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {menuOpen && (
                      <div className="wa-menu">
                        <button
                          onClick={() => {
                            const isBlocked = blockedUsers.includes(activeUserId);
                            handleToggleBlock(activeUserId, isBlocked ? "unblock" : "block");
                          }}
                        >
                          <Ban size={14} />
                          {blockedUsers.includes(activeUserId) ? "Unblock User" : "Block User"}
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            if (activeUserId) {
                              router.push(`/dashboard/Userprofile?userId=${activeUserId}`);
                            }
                          }}
                        >
                          <Users size={14} />
                          View Profile
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <h2>Select a user</h2>
              )}
            </header>


            <div className="chat-messages-ch" ref={messageScrollRef}>
              {loadingMessages ? (
                <div className="chatloadani">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
                    <div className="absolute inset-0 rounded-full border-3 border-black border-t-transparent animate-spin"></div>
                  </div>
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const own = msg.sender === currentUserId;
                  const senderInitial = (activeUser?.name || activeUser?.email || "A")[0]?.toUpperCase() || "A";

                  return (
                    <div
                      key={msg.id}
                      className={`chat-message-wrap-wrapper ${own ? "chat-message-wrap-wrapper-own" : ""}`}
                    >
                      <div className={`chat-message-wrap ${own ? "chat-message-wrap-own" : ""}`}>
                        <div
                          className={`chat-bubble ${own ? "chat-bubble-own" : ""} ${activeReactionPickerFor === msg.id || forwardTargetMessage?.id === msg.id
                            ? "chat-bubble-menu-open"
                            : ""
                            }`}
                        >
                          <div className="chat-bubble-actions" onClick={(event) => event.stopPropagation()}>
                            {!msg.deletedForEveryone && (
                              <>
                                <button
                                  type="button"
                                  className="chat-bubble-action-btn"
                                  onClick={() =>
                                    setActiveReactionPickerFor((prev) => (prev === msg.id ? "" : msg.id))
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
                                    openForwardModal(msg);
                                  }}
                                  aria-label="Forward message"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
                                    <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" d="M15 10H10H7C5.89543 10 5 10.8954 5 12V18"></path>
                                    <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.5" d="M11 6 15 10 11 14M15 6 19 10 15 14"></path>
                                  </svg>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="chat-bubble-action-btn"
                              onClick={() => {
                                setActiveReactionPickerFor("");
                                openDeleteMessageModal(msg);
                              }}
                              aria-label={msg.sender === currentUserId ? "Delete message" : "Delete for me"}
                            >
                              <Trash2 size={14} className={msg.sender === currentUserId ? "undo-svg" : ""} />
                            </button>

                            {!msg.deletedForEveryone && activeReactionPickerFor === msg.id ? (
                              <div className="chat-reaction-picker" onClick={(event) => event.stopPropagation()}>
                                {quickReactions.map((emoji) => (
                                  <button
                                    type="button"
                                    key={`${msg.id}-${emoji}`}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {msg.deletedForEveryone ? (
                            <p className="chat-deleted-placeholder">
                              <Ban size={14} strokeWidth={2} />
                              <span>This message was deleted</span>
                            </p>
                          ) : msg.messageType === "gif" ? (
                            /\.mp4($|\?)/i.test(msg.text) ? (
                              <video src={msg.text} autoPlay loop muted playsInline className="chat-gif" />
                            ) : (
                              <img src={msg.text} alt="GIF" className="chat-gif" />
                            )
                          ) : msg.messageType === "media" ? (
                            <>
                              <div
                                className={`chat-media-grid ${(msg.attachments || []).length > 1 ? "chat-media-grid-multi" : ""
                                  }`}
                              >
                                {(msg.attachments || []).map((file, index) => {
                                  const isVideo = file.mimeType?.startsWith("video/");
                                  return (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      key={`${msg.id}-media-${index}`}
                                      className="chat-media-item"
                                    >
                                      {isVideo ? (
                                        <video src={file.url} controls className="chat-media-video" />
                                      ) : (
                                        <img
                                          src={file.url}
                                          alt={file.fileName || `media-${index + 1}`}
                                          className="chat-media-image"
                                        />
                                      )}
                                    </a>
                                  );
                                })}
                              </div>
                              {msg.text ? <p className="chat-media-caption">{msg.text}</p> : null}
                            </>
                          ) : msg.messageType === "document" ? (
                            <a
                              href={msg.attachment?.url}
                              target="_blank"
                              rel="noreferrer"
                              download={msg.attachment?.fileName || "document"}
                              className="chat-document"
                            >
                              <div className="chat-document-icon-wrap">
                                <FileText size={18} />
                              </div>
                              <div className="chat-document-content">
                                <strong>{msg.attachment?.fileName || msg.text || "Document"}</strong>
                                <small>
                                  {msg.attachment?.mimeType || "Attachment"} • {formatBytes(msg.attachment?.size)}
                                </small>
                              </div>
                            </a>
                          ) : msg.messageType === "shared_post" && msg.sharedPost?.id ? (
                            <div className="chat-shared-post-wrap">
                              <div className="chat-shared-post-label">Shared post</div>
                              <Link
                                href={msg.sharedPost.url || `/dashboard?post=${msg.sharedPost.id}`}
                                className="chat-shared-post-card"
                              >
                                <div className="chat-shared-post-head">
                                  <div className="chat-shared-post-avatar">
                                    <ReliableImage
                                      src={msg.sharedPost.authorImage}
                                      fallbackSrc="/Profilepic.png"
                                      alt={msg.sharedPost.authorName || "Post author"}
                                      width={40}
                                      height={40}
                                    />
                                  </div>
                                  <div className="chat-shared-post-author-block">
                                    <strong>{msg.sharedPost.authorName || "UniLynk User"}</strong>
                                    <span>{formatPostMetaDate(msg.sharedPost.createdAt)}</span>
                                  </div>
                                </div>
                                {msg.sharedPost.content ? (
                                  <p className="chat-shared-post-content">{msg.sharedPost.content}</p>
                                ) : null}
                                {!!msg.sharedPost.images?.length && (
                                  <div
                                    className={`chat-shared-post-media ${msg.sharedPost.images.length > 1 ? "chat-shared-post-media-grid" : ""
                                      }`}
                                  >
                                    {msg.sharedPost.images.slice(0, 4).map((imageUrl, index) => (
                                      <img
                                        key={`${msg.id}-post-image-${index}`}
                                        src={imageUrl}
                                        alt={`Shared post media ${index + 1}`}
                                        className="chat-shared-post-image"
                                      />
                                    ))}
                                  </div>
                                )}
                              </Link>
                            </div>
                          ) : (
                            <p className="chat-text-message">{msg.text}</p>
                          )}
                        </div>

                        <div className={`chat-message-footer ${own ? "chat-message-footer-own" : ""}`}>
                          {!own ? <div className="chat-message-avatar">
                            <ReliableImage

                              src={activeUser?.image}
                              fallbackSrc="/Profilepic.png"
                              alt={activeUser?.name || "Chat user"}
                              width={30}
                              height={30}
                            />
                          </div> : null}
                          <span className="chat-meta-row mt-1 text-xs text-neutral-400 flex gap-2">
                            {formatChatTimestamp(msg.createdAt)}
                            {own ? (
                              <em className={`chat-status chat-status-${getMessageStatus(msg)}`}>
                                {getMessageStatus(msg) === "sent" ? <Check size={13} /> : <CheckCheck size={13} />}
                              </em>
                            ) : null}
                          </span>
                        </div>

                        {!msg.deletedForEveryone && !!(msg.reactions || []).length && (
                          <div className="chat-reactions-row">
                            {groupedReactions(msg.reactions).map(([emoji, count]) => (
                              <span key={`${msg.id}-${emoji}`} className="chat-reaction-chip">
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
              {!loadingMessages && messages.length === 0 && activeUserId && (
                <div id="nochat-illuistration">
                  <img src="/Chat/nochatill.svg" alt="No chat right now" />
                  <h1 className="nochath">Start a New Conversation</h1>
                  <p className="nochatp">
                    Your messages will appear here. Begin by sending a message to start the conversation.
                  </p>
                </div>
              )}
            </div>

            <ChatComposer
              disabled={!activeUserId || blockedUsers.includes(activeUserId) || blockedBy.includes(activeUserId)}
              placeholder={
                blockedUsers.includes(activeUserId)
                  ? "You have blocked this user. Unblock to message."
                  : blockedBy.includes(activeUserId)
                  ? "You cannot message this user."
                  : "Type your message"
              }
              disabledPlaceholder={
                blockedUsers.includes(activeUserId)
                  ? "You have blocked this user. Unblock to message."
                  : blockedBy.includes(activeUserId)
                  ? "You cannot message this user."
                  : "Select a chat to send messages"
              }
              onSend={sendSocketMessage}
              onError={setError}
              initialText={composerDraft.text}
              initialMedia={composerDraft.media}
              draftKey={composerDraft.key}
            />

            {error && <p className="chat-error">{error}</p>}
          </main>

          <aside className="chat-list-panel">
            <div className="chat-list-head">
              <div>
                <h3>Chats</h3>
                <p>Students & club communities</p>
              </div>
            </div>

            <div className="chat-searchbar">
              <Search size={15} />
              <input
                placeholder="Search chats"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="chat-filters">
              {filters.map((f) => (
                <button
                  key={f.value}
                  className={activeFilter === f.value ? "active" : ""}
                  onClick={() => setActiveFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="chat-list-scroll">
              {loadingUsers && loadingCommunities ? (
                <div className="chat-empty">Loading…</div>
              ) : (
                filteredConversations.map((chat) => (
                  <button
                    key={chat.id}
                    className={`chat-item ${chat.kind === "community" ? "chat-item-community" : ""} ${(chat.kind === "community"
                      ? chat.rawId === activeCommunityId
                      : chat.id === activeUserId)
                      ? "active"
                      : ""
                      }`}
                    onClick={() => handleSelectChatItem(chat)}
                  >
                    <div className="chat-item-avatar">
                      {chat.image ? (
                        <ReliableImage
                          src={chat.image}
                          fallbackSrc="/Profilepic.png"
                          alt={chat.name}
                          width={38}
                          height={38}
                        />
                      ) : (
                        chat.avatar
                      )}
                    </div>
                    <div className="chat-item-content">
                      <div className="chat-item-top">
                        <h4>{chat.name}</h4>
                        <span>{chat.time}</span>
                      </div>
                      <div className="chat-item-bottom">
                        <p>{chat.preview}</p>
                        {chat.unread > 0 && <em>{chat.unread}</em>}
                      </div>
                    </div>
                    {chat.kind === "community" && <span className="chat-community-badge">Community</span>}
                  </button>
                ))
              )}
            </div>
          </aside>
        </>
      )}

      <DeleteMessageModal
        open={deleteModalOpen}
        onOpenChange={(open) => {
          setDeleteModalOpen(open);
          if (!open) setDeleteTargetMessage(null);
        }}
        onConfirm={handleDeleteMessage}
        canDeleteForEveryone={deleteTargetMessage?.sender === currentUserId}
      />

      <ForwardMessageModal
        open={!!forwardTargetMessage}
        onOpenChange={(open) => {
          if (!open) closeForwardModal();
        }}
        message={forwardTargetMessage}
        recipients={forwardingTargetItems}
        onForward={handleForwardMessage}
      />

      <BlockedModal
        open={showBlockedModal}
        onOpenChange={setShowBlockedModal}
        userName={activeUser?.name}
      />

    </div>
  );
}
