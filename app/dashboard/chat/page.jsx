"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./chat.css";

export default function ChatPage() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId),
    [users, activeUserId]
  );

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

    if (!messageText.trim() || !activeUserId || !currentUserId || !socketRef.current) {
      return;
    }

    const text = messageText;

    socketRef.current.emit(
      "send-message",
      {
        senderId: currentUserId,
        receiverId: activeUserId,
        text,
      },
      (response) => {
        if (!response?.ok) {
          setError(response?.error || "Failed to send message");
          return;
        }

        setMessageText("");
        setError("");
      }
    );
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
return(
    <div className="chat-page">
      

      <main className="chat-main-panel">
        <header className="chat-main-header">
          <h2>{activeUser ? `Chat with ${activeUser.name}` : "Select a user"}</h2>
        </header>

        <div className="chat-messages">
          {loadingMessages ? (
            <p>Loading messages...</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${
                  msg.sender === currentUserId ? "chat-bubble-own" : ""
                }`}
              >
                <p>{msg.text}</p>
                <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
              </div>
            ))
          )}
          {!loadingMessages && messages.length === 0 && activeUserId && (
            <p>Start the conversation.</p>
          )}
        </div>

        <form className="chat-compose" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Type your message"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            disabled={!activeUserId}
          />
          <button type="submit" disabled={!activeUserId || !messageText.trim()}>
            Send
          </button>
        </form>

        {error && <p className="chat-error">{error}</p>}
      </main>
      <aside className="chat-users-panel">
        <h2>Users</h2>
        {loadingUsers ? (
          <p>Loading users...</p>
        ) : (
          <div className="chat-users-list">
            {users.map((user) => (
              <button
                key={user.id}
                className={`chat-user-item ${
                  activeUserId === user.id ? "chat-user-item-active" : ""
                }`}
                onClick={() => setActiveUserId(user.id)}
              >
                <div className="chat-user-name">{user.name}</div>
                <div className="chat-user-email">{user.email}</div>
              </button>
            ))}
            {users.length === 0 && <p>No other users found.</p>}
          </div>
        )}
      </aside>
    </div>
);
}