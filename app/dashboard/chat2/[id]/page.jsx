"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Pusher from "pusher-js";
import { MoreHorizontal, Plus, Smile, Mic, ArrowDown, ArrowLeft, CheckCircle2, Forward, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { PickerPopover, PlusDropdown, ReactionPicker, MediaPreviewBar, VoiceRecorder, CallModal, DotsMenu, Modal } from "@/components/chat/chat-ui";
import { cn } from "@/lib/utils";

const fallbackAvatar = (seed) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || "User")}`;
const quickTime = (date) => new Date(date || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ChatRoute() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState("");
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [picker, setPicker] = useState(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [reactingOn, setReactingOn] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [dots, setDots] = useState(false);
  const [call, setCall] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forwardMessage, setForwardMessage] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    async function loadUsers() {
      const res = await fetch("/api/chat/users");
      const data = await res.json();
      if (!alive) return;
      setCurrentUserId(data.currentUserId || "");
      setUsers(data.users || []);
      const found = (data.users || []).find((u) => u.id === id);
      setUser(found || null);
    }
    loadUsers().catch(() => setError("Failed to load users"));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/chat/messages?userId=${id}`)
      .then((res) => res.json())
      .then((data) => alive && setMessages(data.messages || []))
      .catch(() => alive && setError("Failed to load messages"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!currentUserId || !id) return;
    let pusher;
    let channel;
    fetch("/api/pusher/config")
      .then((res) => res.json())
      .then(({ key, cluster }) => {
        if (!key || !cluster) return;
        pusher = new Pusher(key, { cluster, forceTLS: true, channelAuthorization: { endpoint: "/api/pusher/auth", transport: "ajax" } });
        const channelName = `private-chat-${[currentUserId, id].sort().join("-")}`;
        channel = pusher.subscribe(channelName);
        channel.bind("new-message", (message) => setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        channel.bind("message-reactions-updated", ({ messageId, reactions }) => setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions } : m)));
        channel.bind("message-deleted", ({ messageId, userId, deletedForEveryone }) => setMessages((prev) => deletedForEveryone ? prev.map((m) => m.id === messageId ? { ...m, deletedForEveryone: true, text: "" } : m) : userId === currentUserId ? prev.filter((m) => m.id !== messageId) : prev));
      });
    return () => {
      if (channel) channel.unbind_all();
      if (pusher) pusher.disconnect();
    };
  }, [currentUserId, id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  async function send(payload = {}) {
    const body = { receiverId: id, text: text.trim(), messageType: "text", ...payload };
    if (!body.text && body.messageType === "text") return;
    const res = await fetch("/api/chat/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to send message");
    setMessages((prev) => prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]);
    setText("");
    setPendingFile(null);
  }

  async function sendFile() {
    if (!pendingFile?.file) return;
    const form = new FormData();
    form.append("file", pendingFile.file);
    const upload = await fetch("/api/chat/upload", { method: "POST", body: form });
    const data = await upload.json();
    if (!upload.ok) return setError(data.error || "Upload failed");
    const file = data.file;
    if (file.mimeType?.startsWith("image") || file.mimeType?.startsWith("video")) send({ text: "", messageType: "media", attachments: [file] });
    else send({ text: file.fileName, messageType: "document", attachment: file });
  }

  async function react(messageId, emoji) {
    await fetch("/api/chat/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle-reaction", messageId, emoji }) });
  }

  async function deleteMessage(messageId, mine) {
    const mode = mine && confirm("Delete this message for everyone? Press Cancel to delete only for you.") ? "everyone" : "me";
    await fetch("/api/chat/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", messageId, mode }) });
  }

  async function forwardTo(targetUserIds) {
    if (!forwardMessage) return;
    await fetch("/api/chat/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "forward", messageId: forwardMessage.id, targetUserIds }) });
    setForwardMessage(null);
  }

  const displayUser = user || { id, name: "Conversation", email: "", image: fallbackAvatar(id) };
  const forwardableUsers = useMemo(() => users.filter((u) => u.id !== id), [users, id]);

  return <>
    <header className="flex items-center justify-between border-b px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2"><Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa] md:hidden"><ArrowLeft className="h-5 w-5" /></Link><img src={displayUser.image || fallbackAvatar(displayUser.name)} alt={displayUser.name} className="h-9 w-9 rounded-full object-cover" /><div className="truncate font-bold">{displayUser.name}</div></div>
      <div className="relative"><button onClick={() => setDots((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border bg-white"><MoreHorizontal className="h-4 w-4" /></button>{dots && <DotsMenu onClose={() => setDots(false)} items={[{ label: "View profile" }, { label: "Mute notifications" }, { label: "Block user", danger: true }]} />}</div>
    </header>

    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
      {error && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="flex flex-col items-center gap-2 px-6 py-8"><img src={displayUser.image || fallbackAvatar(displayUser.name)} alt={displayUser.name} className="h-20 w-20 rounded-full object-cover" /><div className="text-lg font-extrabold">{displayUser.name}</div><div className="text-sm text-[#62748e]">{displayUser.email}</div></div>
      {loading ? <div className="text-center text-sm text-[#62748e]">Loading messages…</div> : <div className="space-y-4"><div className="text-center text-xs text-[#62748e]">Today</div>{messages.map((m) => {
        const mine = m.sender === currentUserId;
        return <div key={m.id} className={cn("group flex items-end gap-2", mine ? "justify-end" : "justify-start")} onMouseEnter={() => setHoveredMessage(m.id)} onMouseLeave={() => setHoveredMessage(null)}>
          {mine && hoveredMessage === m.id && <MessageBubble onReact={() => setReactingOn(m.id)} onForward={() => setForwardMessage(m)} onDelete={() => deleteMessage(m.id, mine)} side="left" />}
          <div className="relative max-w-[70%]">
            {reactingOn === m.id && <ReactionPicker align={mine ? "right" : "left"} onClose={() => setReactingOn(null)} onPick={(e) => react(m.id, e)} />}
            {renderMessageContent(m, mine)}
            {!!m.reactions?.length && <div className={cn("-mt-2 inline-flex rounded-full border bg-white px-2 py-0.5 text-sm shadow", mine ? "float-right" : "float-left")}>{m.reactions.map((r) => r.emoji).join(" ")}</div>}
          </div>
          {!mine && hoveredMessage === m.id && <MessageBubble onReact={() => setReactingOn(m.id)} onForward={() => setForwardMessage(m)} onDelete={() => deleteMessage(m.id, mine)} side="right" />}
        </div>;
      })}<div className="text-center text-xs text-[#62748e]">This conversation is now end-to-end encrypted</div></div>}
    </div>

    <button onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })} className="absolute bottom-28 right-[400px] hidden rounded-full border bg-white p-2 shadow-md md:block"><ArrowDown className="h-4 w-4" /></button>
    {pendingFile && <MediaPreviewBar file={pendingFile} onRemove={() => setPendingFile(null)} />}
    {recording ? <VoiceRecorder onClose={() => setRecording(false)} /> : <div className="border-t bg-white p-3"><div className="flex items-end gap-2 rounded-3xl bg-[#f2f6fa] px-3 py-2"><div className="relative"><button onClick={() => setPlusOpen((v) => !v)} className="rounded-full p-2 text-[#1d9bf0]"><Plus className="h-5 w-5" /></button>{plusOpen && <PlusDropdown onClose={() => setPlusOpen(false)} onPickFile={(f) => setPendingFile({ file: f, url: URL.createObjectURL(f), type: f.type, name: f.name })} />}</div><button onClick={() => setPicker(picker === "gif" ? null : "gif")} className="h-9 rounded-md border border-[#1d9bf0]/50 px-1.5 text-[11px] font-extrabold text-[#1d9bf0]">GIF</button><button onClick={() => setPicker(picker === "emoji" ? null : "emoji")} className="rounded-full p-2 text-[#1d9bf0]"><Smile className="h-5 w-5" /></button><textarea value={text} rows={1} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); pendingFile ? sendFile() : send(); } }} placeholder="Start a new message" className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none" />{text || pendingFile ? <button onClick={() => pendingFile ? sendFile() : send()} className="rounded-full p-2 text-[#1d9bf0]"><Icon icon="ri:send-ins-line" className="h-5 w-5" /></button> : <button onClick={() => setRecording(true)} className="rounded-full p-2 text-[#1d9bf0]"><Mic className="h-5 w-5" /></button>}<PickerPopover type={picker} onClose={() => setPicker(null)} onPick={(val) => picker === "emoji" ? setText((t) => t + val) : send({ text: val, messageType: "gif" })} /></div></div>}
    {call && <CallModal open onClose={() => setCall(null)} user={displayUser} video={call === "video"} />}
    <ForwardModal open={!!forwardMessage} users={forwardableUsers} onClose={() => setForwardMessage(null)} onForward={forwardTo} />
  </>;
}

function MessageBubble({ onReact, onForward, onDelete }) {
  return <div className="flex items-center gap-1 rounded-full border bg-white p-1 shadow-lg opacity-0 transition group-hover:opacity-100"><button onClick={onReact} className="rounded-full p-1.5 hover:bg-[#f2f6fa]" title="React"><Smile className="h-4 w-4" /></button><button onClick={onForward} className="rounded-full p-1.5 hover:bg-[#f2f6fa]" title="Forward"><Forward className="h-4 w-4" /></button><button onClick={onDelete} className="rounded-full p-1.5 text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button></div>;
}

function renderMessageContent(m, mine) {
  if (m.deletedForEveryone) return <div className="rounded-2xl bg-[#f2f6fa] px-3.5 py-2 text-[15px] italic text-[#62748e]">This message was deleted</div>;
  const bubble = "inline-flex items-end gap-2 rounded-2xl px-3.5 py-2 text-[15px] animate-fade-in";
  const time = <span className={cn("shrink-0 text-[11px]", mine ? "text-white/80" : "text-[#62748e]")}>{quickTime(m.createdAt)}{mine && <CheckCircle2 className="ml-1 inline h-3 w-3" />}</span>;
  if (m.messageType === "gif") return <img src={m.text} alt="GIF" className="mb-1 max-h-60 rounded-2xl" />;
  if (m.messageType === "media") return <>{(m.attachments || []).map((a) => a.mimeType?.startsWith("video") ? <video key={a.url} src={a.url} controls className="mb-1 max-h-80 rounded-2xl" /> : <img key={a.url} src={a.url} alt={a.fileName || "media"} className="mb-1 max-h-80 rounded-2xl object-cover" />)}</>;
  if (m.messageType === "document") return <a href={m.attachment?.url} target="_blank" className="block rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-[#1d9bf0]">{m.attachment?.fileName || m.text || "Download file"}</a>;
  return <div className={cn(bubble, mine ? "bg-[#1d9bf0] text-white" : "bg-[#f2f6fa] text-[#0f172a]")}><span className="whitespace-pre-wrap break-words">{m.text}</span>{time}</div>;
}

function ForwardModal({ open, users, onClose, onForward }) {
  const [selected, setSelected] = useState([]);
  useEffect(() => { if (open) setSelected([]); }, [open]);
  return <Modal open={open} onClose={onClose}><div className="border-b p-4 font-bold">Forward message</div><div className="max-h-80 overflow-y-auto">{users.map((u) => <label key={u.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#f2f6fa]"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => setSelected((s) => s.includes(u.id) ? s.filter((id) => id !== u.id) : [...s, u.id])} /><img src={u.image || fallbackAvatar(u.name)} alt={u.name} className="h-9 w-9 rounded-full" /><span className="font-semibold">{u.name}</span></label>)}</div><div className="flex justify-end gap-2 border-t p-4"><button onClick={onClose} className="rounded-full px-4 py-2 font-semibold">Cancel</button><button disabled={!selected.length} onClick={() => onForward(selected)} className="rounded-full bg-[#1d9bf0] px-4 py-2 font-semibold text-white disabled:opacity-50">Forward</button></div></Modal>;
}
