"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, MoreHorizontal, Paperclip } from "lucide-react";
import { Icon } from "@iconify/react";
import { messageRequests } from "@/lib/mock-data";
import { Modal, DotsMenu } from "@/components/chat/chat-ui";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

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
        <header className="flex items-center gap-3 px-4 py-3"
          style={{
            display: "flex",
            flexDirection: "row",
          }}>
          <Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold">Message Requests</h1>
        </header>
        <div className="flex border-b">
          {["priority", "hidden"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "relative flex-1 py-3 text-sm font-bold capitalize hover:bg-[#f7f9fc]",
                tab === t ? "text-[#000]" : "text-[#62748e]",
              )}
            >
              {t}
              {tab === t && (
                <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />
              )}
            </button>
          ))}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-[#f2f6fa] px-4 py-2">
            <Search className="h-4 w-4 text-[#62748e]" />
            <input

              onChange={(e) => setQ(e.target.value)}
              placeholder="Search requests"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
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
                    "flex items-center gap-3 w-full border-l-2 px-4 py-3 transition hover:bg-[#f7f9fc]",
                    active === c.id ? "active-border border-[#1d9bf0] bg-[#f5f8fa]" : "border-transparent",
                  )}
                >
                  <img
                    src={c.user.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${c.user.name}`}
                    alt={c.user.name}
                    className="h-12 w-12 rounded-full bg-[#f2f6fa] object-cover"
                  />
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex justify-between gap-2">
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
          <header className="flex items-center justify-between border-b px-4 py-2.5"
            style={{
              display: "flex",
              flexDirection: "row",
            }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f6fa]">
                {current.user.name[0]}
              </div>
              <span className="font-bold">{current.user.name}</span>
            </div>
            <div className="relative">
              <button
                onClick={() => setDots((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#536471] transition-all duration-200 hover:border-[#1d9bf0] hover:bg-[#e8f5fe] hover:text-[#1d9bf0] active:scale-95"
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
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center gap-2 border-b px-6 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f6fa] text-2xl">
                {current.user.name[0]}
              </div>
              <div className="text-center">
                <div className="text-lg font-extrabold">{current.user.name}</div>
                <div className="text-sm text-[#62748e]">@{current.user.handle}</div>
                <div className="text-sm text-[#62748e]">
                  <strong className="text-[#000]">{current.user.followers}</strong> Followers · Joined {current.user.joined}
                </div>
              </div>
              <button className="mt-2 rounded-full bg-[#000] px-5 py-1.5 text-sm font-bold text-[#fff]">
                View Profile
              </button>
            </div>
            <div className="p-6 pb-54">
              <div className="mb-4 text-center text-xs text-[#62748e]">
                {current.time}
              </div>
              {!loadedAttach ? (
                <button
                  onClick={() => setLoadedAttach(true)}
                  className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold hover:bg-[#f2f6fa]"
                >
                  Tap to load attachment
                  <Paperclip className="h-4 w-4" />
                </button>
              ) : (
                <div className="mb-3 inline-block rounded-2xl bg-[#f2f6fa] px-3 py-2 text-sm">
                  📎 attachment.pdf
                </div>
              )}
              {current.messages.map((m) => (
                <div key={m.id} className="mt-3 max-w-md whitespace-pre-wrap rounded-2xl bg-[#f2f6fa] px-4 py-3 text-[15px]">
                  {m.text}
                </div>
              ))}
            </div>
          </div>

          {/* Accept popover */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pointer-events-none">
            <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border bg-background/90 backdrop-blur-md p-4 shadow-xl">
              <div className="mx-auto max-w-md rounded-2xl border p-4 text-center">
                <p className="text-sm font-semibold">
                  Accept message request from @{current.user.handle}?
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAccept(true)}
                    className="col-span-2 rounded-full bg-[#000] py-2.5 text-sm font-bold text-[#fff] hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button className="rounded-full border bg-[#fff] border-red-200 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-[#fff3f3]">
                    Block
                  </button>
                  <button className="rounded-full bg-[#f2f6fa] py-2.5 text-sm font-bold hover:opacity-80">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Modal open={accept} onClose={() => setAccept(false)}>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold">Request accepted</h3>
              <p className="mt-2 text-sm text-[#62748e]">
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
    <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-[#62748e] animate-fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f6fa]">
        <Icon icon="solar:chat-line-line-duotone" className="h-8 w-8" />
      </div>
      <p className="text-base font-bold text-[#000]">{label}</p>
      <p className="mt-1 text-sm">You don't have any message requests from accounts in your network</p>
    </div>
  );
}
