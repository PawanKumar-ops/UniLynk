"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./user-profile.css";

function ProfileCard({ item }) {
  if (!item) {
    return (
      <div className="profile-view-card empty-card">
        <p>Search and select a user or club to view profile.</p>
      </div>
    );
  }

  return (
    <div className="profile-view-card">
      <div className="profile-cover" />
      <div className="profile-avatar-wrap">
        <img src={item.image} alt={`${item.name} profile`} className="profile-avatar" />
      </div>
      <div className="profile-content">
        <h2>{item.name}</h2>
        <p className="profile-meta">{item.type === "club" ? "Club" : "User"}</p>
        {item.type === "user" && item.email ? <p className="profile-email">{item.email}</p> : null}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    let ignore = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();

        if (!ignore) {
          const items = data.results || [];
          setResults(items);
          if (items.length > 0 && !searchTerm.trim()) {
            setSelectedItem((prev) => prev || items[0]);
          }
        }
      } catch {
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return results;
  }, [results, searchTerm]);

  const handleSuggestionClick = (item) => {
    setSelectedItem(item);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="userprofile-page">
      <div className="profile-search-block">
        <input
          type="text"
          className="profile-search-input"
          placeholder="Search users/clubs by name or roll number"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        {searchTerm.trim() && (
          <div className="profile-suggestions">
            {loading ? (
              <div className="suggestion-empty">Searching...</div>
            ) : suggestions.length === 0 ? (
              <div className="suggestion-empty">No users or clubs found.</div>
            ) : (
              suggestions.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <img src={item.image} alt={`${item.name} avatar`} />
                  <div className="suggestion-text">
                    <strong>{item.name}</strong>
                    <span>{item.type === "club" ? "Club" : "User"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <ProfileCard item={selectedItem} />
    </div>
  );
}
