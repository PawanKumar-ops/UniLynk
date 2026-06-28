"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Paperclip } from "lucide-react";
import { messageRequests } from "@/lib/mock-data";
import { Modal, DotsMenu } from "@/components/chat/chat-ui";
import { cn } from "@/lib/utils";

export default function RequestsRoute() {
  const [tab, setTab] = useState("priority");
  const [active, setActive] = useState(messageRequests[0]?.id ?? null);
  const [accept, setAccept] = useState(false);
  const [dots, setDots] = useState(false);
  const [loadedAttach, setLoadedAttach] = useState(false);
  const router = useRouter();
  const current = messageRequests.find((m) => m.id === active) ?? null;

  return (
    <div className="flex h-full flex-1 flex-col md:flex-row-reverse">
      {/* Requests right-side list */}
      <div className="flex w-full flex-col border-t bg-[#ffff] md:w-[380px] md:border-t-0 md:border-l">
        <header className="flex items-center gap-3 px-4 py-3">
          <Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold"># Message Requests</h1>
        </header>
        <div className="flex border-b">
          {["priority", "hidden"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative flex-1 py-3 text-sm font-bold capitalize hover:bg-muted/50",
                tab === t ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
              )}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "priority" ? (
            messageRequests.length === 0 ? (
              <EmptyRequests />
            ) : (
              messageRequests.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  className={cn(
                    "flex items-center gap-3 border-l-2 px-4 py-3 text-left transition hover:bg-[#f7f9fc]",
                    active === c.id ? "active-border border-[#1d9bf0] bg-[#f5f8fa]" : "border-transparent",
                  )}
                >
                  <img
                    src={c.user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${c.user.name}`}
                    alt={c.user.name}
                    className="h-12 w-12 rounded-full bg-[#f2f6fa] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 truncate">
                        <span className="truncate font-bold">{c.user.name}</span>
                        <span className="truncate text-sm text-[#62748e]">@{c.user.handle}</span>
                      </div>
                      <span className="shrink-0 text-xs text-[#62748e]">· {c.time}</span>
                    </div>
                    <p className="truncate text-sm text-[#62748e]">{c.preview}</p>
                  </div>
                </button>
              ))
            )
          ) : (
            <EmptyRequests label="No hidden requests" />
          )}
        </div>
      </div>

      {/* Request preview */}
      {current ? (
        <div className="relative flex min-w-0 flex-1 flex-col border-b md:border-b-0 md:border-r">
          <header className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                {current.user.name[0]}
              </div>
              <span className="font-bold">{current.user.name}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setDots((v) => !v)}
                className="rounded-full bg-muted p-2.5 hover:opacity-80"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {dots && (
                <DotsMenu
                  onClose={() => setDots(false)}
                  items={[
                    { label: "Report user", danger: true },
                    { label: "Block user", danger: true },
                  ]}
                />
              )}
            </div>
          </header>
          <div className="flex flex-col items-center gap-2 border-b px-6 py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl">
              {current.user.name[0]}
            </div>
            <div className="text-center">
              <div className="text-lg font-extrabold">{current.user.name}</div>
              <div className="text-sm text-muted-foreground">@{current.user.handle}</div>
              <div className="text-sm text-muted-foreground">
                <strong className="text-foreground">{current.user.followers}</strong> Followers · Joined {current.user.joined}
              </div>
            </div>
            <button className="mt-2 rounded-full bg-foreground px-5 py-1.5 text-sm font-bold text-background">
              View Profile
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-4 text-center text-xs text-muted-foreground">
              {current.time}
            </div>
            {!loadedAttach ? (
              <button
                onClick={() => setLoadedAttach(true)}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Tap to load attachment
                <Paperclip className="h-4 w-4" />
              </button>
            ) : (
              <div className="mb-3 inline-block rounded-2xl bg-muted px-3 py-2 text-sm">
                📎 attachment.pdf
              </div>
            )}
            {current.messages.map((m) => (
              <div key={m.id} className="mt-3 max-w-md whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 text-[15px]">
                {m.text}
              </div>
            ))}
          </div>

          {/* Accept popover */}
          <div className="border-t bg-background p-4 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]">
            <div className="mx-auto max-w-md rounded-2xl border p-4 text-center">
              <p className="text-sm font-semibold">
                Accept message request from @{current.user.handle}?
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAccept(true)}
                  className="col-span-2 rounded-full bg-foreground py-2.5 text-sm font-bold text-background hover:opacity-90"
                >
                  Accept
                </button>
                <button className="rounded-full border border-red-200 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                  Block
                </button>
                <button className="rounded-full bg-muted py-2.5 text-sm font-bold hover:opacity-80">
                  Delete
                </button>
              </div>
            </div>
          </div>

          <Modal open={accept} onClose={() => setAccept(false)}>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold">Request accepted</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You can now message @{current.user.handle} directly.
              </p>
              <button
                onClick={() => router.push(`/dashboard/chat2/${current.id}`)}
                className="mt-4 rounded-full bg-[#1d9bf0] px-6 py-2 font-bold text-white"
              >
                Open conversation
              </button>
            </div>
          </Modal>
        </div>
      ) : (
        <EmptyRequests />
      )}
    </div>
  );
}

function EmptyRequests({ label = "No message requests" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-muted-foreground animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </div>
      <p className="text-base font-bold text-foreground">{label}</p>
      <p className="mt-1 text-sm">You don't have any message requests from accounts in your network</p>
    </div>
  );
}
