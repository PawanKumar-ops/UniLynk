"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Search,
  Smile,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import "./chat.css";
import ReliableImage from "@/components/ReliableImage";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";
const gf = new GiphyFetch(GIPHY_API_KEY);

function GiphyPicker({ onSelect }) {
  const [query, setQuery] = useState("");

  const fetchGifs = (offset) => {
    if (query.trim()) {
      return gf.search(query, { offset, limit: 20 });
    }
    return gf.trending({ offset, limit: 20 });
  };

  return (
    <div className="giphy-picker-wrapper">
      {/* 🔍 Search Bar */}
      <div className="giphy-search">
        <div className="gif-search">
        <Search size={16} />
        <input
          type="text"
          placeholder="Search GIFs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        </div>
      </div>

      {/*  GIF Grid */}
      <div className="giphy-grid-scroll">
      <Grid
        width={340}
        columns={2}
        gutter={8}
        fetchGifs={fetchGifs}
        key={query} // 🔥 forces refresh when query changes
        onGifClick={(gif, e) => {
          e.preventDefault();
          const videoUrl =
            gif.images.original_mp4?.mp4 ||
            gif.images.fixed_height?.mp4;

          if (videoUrl) onSelect(videoUrl);
        }}
      />
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAttachmentFab, setShowAttachmentFab] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [pendingDocument, setPendingDocument] = useState(null);

  const socketRef = useRef(null);
  const messageScrollRef = useRef(null);
  const fileInputRef = useRef(null);


  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId),
    [users, activeUserId]
  );

  useEffect(() => {
    if (!messageScrollRef.current) return;
    messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
  }, [messages]);

  function sendSocketMessage(payload) {
    if (!activeUserId || !currentUserId || !socketRef.current) {
      setError("Select a user and wait for chat connection");
      return;
    }

    socketRef.current.emit(
      "send-message",
      {
        senderId: currentUserId,
        receiverId: activeUserId,
        ...payload,
      },
      (response) => {
        if (!response?.ok) {
          setError(response?.error || "Failed to send message");
          return;
        }

        setError("");
      }
    );
  }

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/chat/users", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }

      setUsers(data.users || []);
      setCurrentUserId(data.currentUserId || "");

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

  async function loadMessages(userId) {
    if (!userId) return;

    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/chat/messages?userId=${userId}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load messages");
      }

      setMessages(data.messages || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();

    const trimmedText = messageText.trim();

    if (!trimmedText && !pendingDocument) {
      return;
    }

    if (pendingDocument) {
      sendSocketMessage({
        text: pendingDocument.fileName || "Document",
        messageType: "document",
        attachment: pendingDocument,
      });
      setPendingDocument(null);
    }

    if (trimmedText) {
      sendSocketMessage({
        text: trimmedText,
        messageType: "text",
      });
    }

    setMessageText("");
    setShowAttachmentFab(false);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  }

  function handleEmojiSelect(emojiData) {
    if (!emojiData?.emoji) return;

    setMessageText((prev) => `${prev}${emojiData.emoji}`);
    setShowEmojiPicker(false);
  }

  function handleGifSelect(mediaUrl) {
  if (!mediaUrl) return;

  sendSocketMessage({
    text: mediaUrl,
    messageType: "gif",
  });

  setShowGifPicker(false);
  setShowAttachmentFab(false);
}

  async function handleDocumentUpload(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) return;

    if (!activeUserId) {
      setError("Please select an active user to send documents");
      return;
    }

    try {
      setUploadingDocument(true);
      setError("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }

      setPendingDocument(data.file);
      setShowAttachmentFab(false);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!activeUserId) return;
    loadMessages(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    let isMounted = true;

    async function initSocket() {
      try {
        await fetch("/api/socket", { method: "GET" });

        if (!isMounted) return;

        const socket = io({
          path: "/api/socket_io",
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("register-user", currentUserId);
        });

        socket.on("new-message", (incomingMessage) => {
          const isInOpenThread =
            incomingMessage.sender === activeUserId ||
            incomingMessage.receiver === activeUserId;

          if (!isInOpenThread) {
            return;
          }

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === incomingMessage.id);
            if (exists) return prev;
            return [...prev, incomingMessage];
          });
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
  }, [currentUserId, activeUserId]);



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
        };
      }),
    [users]
  );

  const filters = [
    { label: "All Chats", value: "all" },
    { label: "Clubs", value: "club" },
    { label: "Students", value: "student" },
  ];

  const filteredConversations = useMemo(
    () =>
      conversations.filter((c) => {
        const bySearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const byFilter = activeFilter === "all" || c.category === activeFilter;
        return bySearch && byFilter;
      }),
    [conversations, searchTerm, activeFilter]
  );



  return (
    <div className="chat-page">


      <main className="chat-main-panel">
        <header className="chat-main-header">
          {activeUser ? (
            <div className="active-user-header">
              <div className="active-user-avatar">
                <ReliableImage
                  src={activeUser.image}
                  fallbackSrc="/Profilepic.png"
                  alt={activeUser.name}
                  width={46}
                  height={46}
                />
              </div>

              <div className="active-user-info">
                <h2>{activeUser.name}</h2>
                <p className="user-email">{activeUser.email}</p>
              </div>
            </div>
          ) : (
            <h2>Select a user</h2>
          )}
        </header>

        <div className="chat-messages" ref={messageScrollRef}>
          {loadingMessages ? (
            <div className="chatloadani">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-3 border-gray-200"></div>
                <div className="absolute inset-0 rounded-full border-3 border-black border-t-transparent animate-spin"></div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.sender === currentUserId ? "chat-bubble-own" : ""}`}
              >
                {msg.messageType === "gif" ? (
                  msg.text.endsWith(".mp4") ? (
                    <video
                      src={msg.text}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="chat-gif"
                    />
                  ) : (
                    <img
                      src={msg.text}
                      alt="GIF"
                      className="chat-gif"
                    />
                  )
                ) : msg.messageType === "document" ? (
                  <a
                    href={msg.attachment?.url}
                    target="_blank"
                    rel="noreferrer"
                    download={msg.attachment?.fileName || "document"}
                    className="chat-document"
                  >
                    <FileText size={17} />
                    <div>
                      <strong>{msg.attachment?.fileName || msg.text || "Document"}</strong>
                      <small>{msg.attachment?.mimeType || "Attachment"}</small>
                    </div>
                  </a>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          )}
          {!loadingMessages && messages.length === 0 && activeUserId && (
            <div id="nochat-illuistration">
              <img src="/Chat/nochatill.svg" alt="No chat right now" />
              <h1 className="nochath">Start a New Conversation</h1>
              <p className="nochatp">
                Your messages will appear here. Begin by sending a message to
                start the conversation.
              </p>
            </div>
          )}
        </div>

        <form className="chat-compose" onSubmit={sendMessage}>
          <div className="chat-attachment-wrap">
            <button
              className="chatmediabtn"
              type="button"
              onClick={() => setShowAttachmentFab((prev) => !prev)}
              disabled={!activeUserId || uploadingDocument}
            >
              {showAttachmentFab ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            </button>

            {showAttachmentFab && (
              <div className="chat-fab-menu">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmojiPicker((prev) => !prev);
                    setShowGifPicker(false);
                  }}
                >
                  <Smile size={16} /> Emoji
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker((prev) => !prev);
                    setShowEmojiPicker(false);
                  }}
                >
                  <ImageIcon size={16} /> GIF
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingDocument}
                >
                  <FileText size={16} />
                  {uploadingDocument ? "Uploading..." : "Document"}
                </button>
              </div>
            )}

            {showEmojiPicker && (
              <div className="chat-picker">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width={320}
                  height={360}
                  lazyLoadEmojis
                />
              </div>
            )}

            {showGifPicker && (
              <div className="chat-picker chat-gif-picker">
                <GiphyPicker onSelect={handleGifSelect} />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="chat-hidden-input"
              onChange={handleDocumentUpload}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            />
          </div>

          <div className="chat-compose-inputs">
            {pendingDocument && (
              <div className="chat-pending-document">
                <FileText size={14} />
                <span>{pendingDocument.fileName}</span>
                <button
                  type="button"
                  onClick={() => setPendingDocument(null)}
                  aria-label="Remove selected document"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <input
              className="chatcomposeinput"
              type="text"
              placeholder="Type your message"
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              disabled={!activeUserId}
            />
          </div>
          <button
            className="chatsendbtn"
            type="submit"
            disabled={!activeUserId || (!messageText.trim() && !pendingDocument)}
          >
            Send
          </button>
        </form>

        {error && <p className="chat-error">{error}</p>}
      </main>
      <aside className="chat-list-panel">
        <div className="chat-list-head">
          <h3>Chats</h3>
          <p>Students & clubs</p>
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
          {loadingUsers ? (
            <div className="chat-empty">Loading users…</div>
          ) : (
            filteredConversations.map((chat) => (
              <button
                key={chat.id}
                className={`chat-item ${chat.id === activeUserId ? "active" : ""
                  }`}
                onClick={() => setActiveUserId(chat.id)}
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
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}