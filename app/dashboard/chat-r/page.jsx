"use client";

import React, { useMemo, useState } from "react";
import "./chat.css";
import { Search, Send, Phone, Video, MoreHorizontal, Paperclip } from "lucide-react";

const conversations = [
  {
    id: 1,
    name: "Innovation Cell Community",
    role: "Club Community",
    avatar: "IC",
    category: "community",
    preview: "Tech Team: Final API checklist posted for Build-a-thon.",
    time: "2m",
    unread: 4,
    channels: ["Tech Team", "Design Team", "Outreach Team", "Content Team"],
    members: "124 members",
  },
  {
    id: 2,
    name: "Innovation Cell Core",
    role: "Club",
    avatar: "CO",
    category: "club",
    preview: "Core members meeting moved to Seminar Hall B.",
    time: "12m",
    unread: 1,
    channels: ["Core Team", "Leads"],
    members: "28 members",
  },
  {
    id: 3,
    name: "Ananya Singh",
    role: "Student",
    avatar: "AS",
    category: "direct",
    preview: "Can you share the event poster draft?",
    time: "22m",
    unread: 0,
    members: "Student",
  },
  {
    id: 4,
    name: "Photography Club",
    role: "Club",
    avatar: "PC",
    category: "club",
    preview: "We'll cover your hackathon opening ceremony 📸",
    time: "1h",
    unread: 2,
    members: "81 members",
  },
  {
    id: 5,
    name: "Aarav Mehta",
    role: "Student",
    avatar: "AM",
    category: "direct",
    preview: "Let's collaborate for the design sprint.",
    time: "3h",
    unread: 0,
    members: "Student",
  },
];

const messagesByConversation = {
  1: [
    { id: 1, sender: "them", text: "Tech Team: API integration completed for registration flow.", time: "9:14 PM" },
    { id: 2, sender: "me", text: "Great! Design Team can now connect the final UI screens.", time: "9:16 PM" },
    { id: 3, sender: "them", text: "Outreach Team draft is ready for socials. Please review.", time: "9:17 PM" },
    { id: 4, sender: "me", text: "Perfect. Let's lock everything by 10 PM.", time: "9:18 PM" },
  ],
  2: [
    { id: 1, sender: "them", text: "Core members meeting moved to Seminar Hall B.", time: "8:20 PM" },
    { id: 2, sender: "me", text: "Noted. I will inform the volunteers.", time: "8:22 PM" },
  ],
  3: [
    { id: 1, sender: "them", text: "Can you share the event poster draft?", time: "7:03 PM" },
    { id: 2, sender: "me", text: "Sending now. Check your mail in 2 mins.", time: "7:05 PM" },
  ],
  4: [
    { id: 1, sender: "them", text: "We'll cover your hackathon opening ceremony 📸", time: "5:45 PM" },
    { id: 2, sender: "me", text: "Awesome, please capture registration desk too.", time: "5:47 PM" },
  ],
  5: [
    { id: 1, sender: "them", text: "Let's collaborate for the design sprint.", time: "4:40 PM" },
    { id: 2, sender: "me", text: "Done. Let's meet after classes.", time: "4:41 PM" },
  ],
};

const filters = [
  { label: "All Chats", value: "all" },
  { label: "Club Chats", value: "club" },
  { label: "Community", value: "community" },
  { label: "Direct", value: "direct" },
];

export default function ChatPage() {
  const [activeChatId, setActiveChatId] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredConversations = useMemo(
    () =>
      conversations.filter((chat) => {
        const bySearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase());
        const byFilter = activeFilter === "all" ? true : chat.category === activeFilter;
        return bySearch && byFilter;
      }),
    [searchTerm, activeFilter]
  );

  const activeConversation = conversations.find((chat) => chat.id === activeChatId) ?? conversations[0];
  const activeMessages = messagesByConversation[activeConversation.id] ?? [];

  return(
    <div className="chat-page-shell">

      <main className="chat-main-panel">
        <header className="chat-main-header">
            <div className="chat-main-header-left">
            <div className="club-chat-logo">
                <img src="/Defaultclublogo.svg" alt="" />
            </div>
            <div className="user-club-name">Innovation Cell</div>
            </div>
        
          <div className="chat-header-actions">
            <button aria-label="Audio call"><Phone size={16} /></button>
            <button aria-label="Video call"><Video size={16} /></button>
            <button aria-label="More"><MoreHorizontal size={16} /></button>
          </div>
        </header>

        <section className="messages-wrap">
          <div className="day-chip">Today</div>
          {activeMessages.map((message) => (
            <div key={message.id} className={`message-row ${message.sender === "me" ? "mine" : "theirs"}`}>
              <div className="message-bubble">
                <p>{message.text}</p>
                <span>{message.time}</span>
              </div>
            </div>
          ))}
        </section>

        <form
          className="composer-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newMessage.trim()) return;
            setNewMessage("");
          }}
        >
          <button type="button" className="attach-btn" aria-label="Attach file"><Paperclip size={16} /></button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a message..."
          />
          <button type="submit" className="send-btn" aria-label="Send message"><Send size={15} /> Send</button>
        </form>
      </main>

      <aside className="chat-list-panel">
        <div className="chat-list-head">
          <h3>Chats</h3>
          <p>Students & clubs</p>
        </div>

        <div className="chat-searchbar">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search chats"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="chat-filters">
          {filters.map((item) => (
            <button
              key={item.value}
              className={activeFilter === item.value ? "active" : ""}
              onClick={() => setActiveFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="chat-list-scroll">
          {filteredConversations.map((chat) => (
            <button
              key={chat.id}
              className={`chat-item ${chat.id === activeConversation.id ? "active" : ""}`}
              onClick={() => setActiveChatId(chat.id)}
            >
              <div className="chat-item-avatar">{chat.avatar}</div>
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
          ))}
          {filteredConversations.length === 0 ? <div className="chat-empty">No chats found.</div> : null}
        </div>
      </aside>
    </div>
  );
}