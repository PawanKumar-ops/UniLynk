"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/chat/chat-ui";
import ChatConversation from "@/components/chat/ChatConversation";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function RequestsRoute() {
  const [tab, setTab] = useState("priority");
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState(null);
  const [accept, setAccept] = useState(false);
  const [q, setQ] = useState("");
  const [mobileShowPreview, setMobileShowPreview] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const current = requests.find((m) => m.id === active) ?? null;

  async function loadRequests() {
    const res = await fetch("/api/chat/requests", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load requests");
    setRequests(data.requests || []);
    setActive((value) => value && data.requests?.some((item) => item.id === value) ? value : data.requests?.[0]?.id ?? null);
  }

  useEffect(() => { loadRequests().catch((err) => setError(err.message)); }, []);

  async function blockCurrent() {
    if (!current) return;
    const res = await fetch("/api/chat/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: current.id, action: "block" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to block user");
    await updateRequest("delete");
  }

  async function updateRequest(action) {
    if (!current) return;
    const res = await fetch("/api/chat/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterId: current.id, action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update request");
    if (action === "accept") setAccept(true);
    else await loadRequests();
  }

  const visibleRequests = requests.filter((item) => !q || item.user.name.toLowerCase().includes(q.toLowerCase()) || item.user.handle.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row-reverse">
      <div className={cn("flex min-h-0 w-full flex-col border-t bg-white md:w-[380px] md:border-t-0 md:border-l", mobileShowPreview ? "hidden md:flex" : "flex")}>
        <header className="flex items-center gap-3 px-4 py-3" style={{ display: "flex", flexDirection: "row" }}>
          <Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-extrabold">Message Requests</h1>
        </header>
        <div className="flex border-b">
          {["priority", "hidden"].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("relative flex-1 py-3 text-sm font-bold capitalize hover:bg-[#f7f9fc]", tab === t ? "text-[#000]" : "text-[#62748e]")}>{t}{tab === t && <span className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#1d9bf0]" />}</button>
          ))}
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 rounded-full bg-[#f2f6fa] px-4 py-2">
            <Search className="h-4 w-4 text-[#62748e]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search requests" className="flex-1 bg-transparent text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto pb-4 md:pb-0">
          {tab === "priority" ? (
            visibleRequests.length === 0 ? <EmptyRequests label={error || "No message requests"} /> : visibleRequests.map((c) => (
              <button key={c.id} onClick={() => { setActive(c.id); setMobileShowPreview(true); }} className={cn("flex w-full items-center gap-3 border-l-2 px-4 py-3 transition hover:bg-[#f7f9fc]", active === c.id ? "active-border border-[#1d9bf0] bg-[#f5f8fa]" : "border-transparent")}>
                <img src={c.user.avatar} alt={c.user.name} className="h-12 w-12 rounded-full bg-[#f2f6fa] object-cover" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex justify-between gap-2"><div className="flex items-center gap-1 truncate"><span className="truncate font-bold">{c.user.name}</span><span className="truncate text-sm text-[#62748e]">@{c.user.handle}</span></div><span className="shrink-0 text-xs text-[#62748e]">· {c.time}</span></div>
                  <p className="truncate text-sm text-[#62748e]">{c.preview}</p>
                </div>
              </button>
            ))
          ) : <EmptyRequests label="No hidden requests" />}
        </div>
      </div>

      {current ? (
        <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col border-b md:border-b-0 md:border-r", mobileShowPreview ? "flex" : "hidden md:flex")}>
          <ChatConversation id={current.id} requestMode onBack={() => setMobileShowPreview(false)} onRequestBlock={() => updateRequest("delete").catch((err) => setError(err.message))} />
          <div className="sticky bottom-0 z-20 shrink-0 border-t bg-white/95 p-4 backdrop-blur-md">
            <div className="mx-auto max-w-md rounded-2xl border bg-background/90 p-4 shadow-xl">
              <div className="mx-auto max-w-md rounded-2xl border p-4 text-center">
                <p className="text-sm font-semibold">Accept message request from @{current.user.handle}?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => updateRequest("accept").catch((err) => setError(err.message))} className="col-span-2 rounded-full bg-[#000] py-2.5 text-sm font-bold text-[#fff] hover:opacity-90">Accept</button>
                  <button onClick={() => blockCurrent().catch((err) => setError(err.message))} className="rounded-full border bg-[#fff] border-red-200 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-[#fff3f3]">Block</button>
                  <button onClick={() => updateRequest("delete").catch((err) => setError(err.message))} className="rounded-full bg-[#f2f6fa] py-2.5 text-sm font-bold hover:opacity-80">Delete</button>
                </div>
              </div>
            </div>
          </div>
          <Modal open={accept} onClose={() => setAccept(false)}>
            <div className="p-6 text-center"><h3 className="text-xl font-bold">Request accepted</h3><p className="mt-2 text-sm text-[#62748e]">You can now message @{current.user.handle} directly.</p><button onClick={() => router.push(`/dashboard/chat2/${current.id}`)} className="mt-4 rounded-full bg-[#1d9bf0] px-6 py-2 font-bold text-white">Open conversation</button></div>
          </Modal>
        </div>
      ) : <div className={cn("relative flex min-w-0 flex-1 flex-col", mobileShowPreview ? "flex" : "hidden md:flex")}><EmptyRequests /></div>}
    </div>
  );
}

function EmptyRequests({ label = "No message requests" }) {
  return <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-[#62748e] animate-fade-in"><div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f6fa]"><Icon icon="solar:chat-line-line-duotone" className="h-8 w-8" /></div><p className="text-base font-bold text-[#000]">{label}</p><p className="mt-1 text-sm">You don't have any message requests from accounts in your network</p></div>;
}
