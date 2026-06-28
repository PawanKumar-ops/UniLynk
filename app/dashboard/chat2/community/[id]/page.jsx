"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Users, Bell, MoreHorizontal, Hash } from "lucide-react";
import { communities } from "@/lib/mock-data";
import { DotsMenu } from "@/components/chat/chat-ui";

export default function CommunityRoute() {
  const params = useParams();
  const id = params?.id;
  const c = communities.find((x) => x.id === id);
  const [joined, setJoined] = useState(false);
  const [dots, setDots] = useState(false);
  if (!c)
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Community not found
      </div>
    );

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-extrabold">{c.name}</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setDots((v) => !v)}
            className="rounded-full bg-[#f2f6fa] p-2.5 hover:opacity-80"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {dots && (
            <DotsMenu
              onClose={() => setDots(false)}
              items={[
                { label: "Invite to community" },
                { label: "Pin community" },
                { label: "Mute community" },
                { label: "Leave community", danger: true },
              ]}
            />
          )}
        </div>
      </header>

      <div className="relative h-44 w-full overflow-hidden">
        <img src={c.cover} alt={c.name} className="h-full w-full object-cover" />
      </div>

      <div className="border-b p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">{c.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {c.members.toLocaleString()} members
            </div>
          </div>
          <button
            onClick={() => setJoined((v) => !v)}
            className={`rounded-full px-5 py-2 text-sm font-bold ${
              joined
                ? "border bg-[#fff] hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
                : "bg-[#000] text-[#fff] hover:opacity-90"
            }`}
          >
            {joined ? "Joined" : "Join"}
          </button>
        </div>
      </div>

      <div className="flex border-b text-sm font-bold">
        {["Home", "Members", "About"].map((t, i) => (
          <button
            key={t}
            className={`relative flex-1 py-3 hover:bg-muted/50 ${
              i === 0 ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
            {i === 0 && (
              <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {[1, 2, 3].map((i) => (
          <article
            key={i}
            className="rounded-2xl border p-4 transition hover:bg-muted/30 animate-fade-in"
          >
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-[#1d9bf0]" />
              <span className="font-bold">Member {i}</span>
              <span className="text-muted-foreground">· {i}h</span>
            </div>
            <p className="mt-2 text-[15px]">
              Excited to be part of {c.name}! Looking forward to sharing ideas with everyone here.
            </p>
            <div className="mt-3 flex gap-6 text-sm text-muted-foreground">
              <button className="hover:text-[#1d9bf0]">💬 12</button>
              <button className="hover:text-green-500">🔁 4</button>
              <button className="hover:text-red-500">❤️ 88</button>
              <button className="hover:text-[#1d9bf0]">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
