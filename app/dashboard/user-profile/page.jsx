"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import "./user-profile.css";

const UserProfilePage = () => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }

    const getUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/me", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not fetch user profile");
        }

        setProfile(data.user);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();
  }, [status]);

  if (status === "loading" || loading) {
    return <div className="user-profile-page">Loading profile...</div>;
  }

  if (status !== "authenticated") {
    return <div className="user-profile-page">Please log in to view your profile.</div>;
  }

  if (error) {
    return <div className="user-profile-page">{error}</div>;
  }

  return (
    <div className="user-profile-page">
      <div className="user-profile-card">
        <img
          className="user-profile-image"
          src={profile?.image || "/Profilepic.png"}
          alt={`${profile?.name || "User"} profile`}
        />

        <h1>{profile?.name || session?.user?.name || "User"}</h1>
        <p><strong>Email:</strong> {profile?.email || session?.user?.email || "Not available"}</p>
        <p><strong>Provider:</strong> {profile?.provider || "Unknown"}</p>

        <div className="user-profile-meta">
          <span>
            Joined: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
