"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Plus, Smile, Mic, ArrowDown, ArrowLeft, CheckCircle2, Trash2, Undo2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { PickerPopover, PlusDropdown, ReactionPicker, MediaPreviewBar, VoiceRecorder, CallModal, DotsMenu } from "@/components/chat/chat-ui";
import { DeleteMessageModal } from "@/components/DeleteMessageModal";
import { ForwardMessageModal } from "@/components/ForwardMessageModal";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/usePusher";

function toChatMessage(msg, currentUserId) {
  const mine = msg.sender === currentUserId;
  const media = msg.messageType === "gif" ? { type: "gif", url: msg.text } : msg.messageType === "media" ? { type: msg.attachments?.[0]?.mimeType?.startsWith("video/") ? "video" : "image", url: msg.attachments?.[0]?.url } : null;
  return { ...msg, from: mine ? "me" : msg.sender, time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), media };
}

const fallbackAvatar = (seed) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || "User")}`;
const quickTime = (date) => new Date(date || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ChatRoute() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUserId, setCurrentUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState(searchParams.get("text") || "");
  const [picker, setPicker] = useState(null);
  const [plusOpen, setPlusOpen] = useState(false);
  const [reactingOn, setReactingOn] = useState(null);
  const [actionOpen, setActionOpen] = useState(null);
  const [dots, setDots] = useState(false);
  const [call, setCall] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
  const [forwardTargetMessage, setForwardTargetMessage] = useState(null);
  const scrollRef = useRef(null);

  const activeUser = useMemo(() => users.find((u) => u.id === id), [users, id]);
  const isCommunityRoute = typeof id === "string" && id.startsWith("community:");
  const [, communityId, groupId] = isCommunityRoute ? id.split(":") : [];

  useEffect(() => {
    async function bootstrap() {
      const [userRes, communityRes] = await Promise.all([fetch("/api/chat/users", { cache: "no-store" }), fetch("/api/communities", { cache: "no-store" })]);
      const userData = await userRes.json();
      const communityData = await communityRes.json();
      if (userRes.ok) { setUsers(userData.users || []); setCurrentUserId(userData.currentUserId || ""); }
      if (communityRes.ok) setCommunities(communityData.communities || []);
    }
    bootstrap().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!id || !currentUserId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const url = isCommunityRoute ? `/api/communities/${communityId}/groups/${groupId}/messages` : `/api/chat/messages?userId=${id}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load messages");
      if (!cancelled) setMessages((data.messages || []).map((m) => toChatMessage(m, currentUserId)));
      setLoading(false);
      if (!isCommunityRoute) fetch("/api/chat/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "mark-read", otherUserId: id }) });
    }
    load().catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id, currentUserId, isCommunityRoute, communityId, groupId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => {
    if (!currentUserId) return;
    let channel;
    let mounted = true;
    getPusherClient().then((pusher) => {
      if (!pusher || !mounted) return;
      channel = pusher.subscribe(isCommunityRoute ? `private-community-${communityId}` : `private-user-${currentUserId}`);
      channel.bind("new-message", (incoming) => {
        const inThread = isCommunityRoute ? incoming.communityId === communityId && incoming.groupId === groupId : ((incoming.sender === id && incoming.receiver === currentUserId) || (incoming.sender === currentUserId && incoming.receiver === id));
        if (!inThread) return;
        setMessages((prev) => prev.some((m) => m.id === incoming.id) ? prev : [...prev, toChatMessage(incoming, currentUserId)]);
      });
      channel.bind("message-reactions-updated", ({ messageId, reactions }) => setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, reactions: reactions || [] } : m)));
      channel.bind("message-deleted", ({ messageId, mode, userId, deletedForEveryone }) => setMessages((prev) => mode === "for-me" && userId === currentUserId ? prev.filter((m) => m.id !== messageId) : deletedForEveryone ? prev.map((m) => m.id === messageId ? { ...m, deletedForEveryone: true, text: "" } : m) : prev));
    });
    return () => { mounted = false; if (channel) { channel.unbind_all(); channel.unsubscribe(); } };
  }, [currentUserId, id, isCommunityRoute, communityId, groupId]);

  const user = activeUser ? { id: activeUser.id, name: activeUser.name, handle: activeUser.email?.split("@")[0] || "user", avatar: activeUser.image || "/Profilepic.png", verified: false, followers: 0, joined: "recently" } : null;
  const community = communities.find((c) => c.id === communityId);
  const group = community?.groups?.find((g) => g.id === groupId);
  const header = isCommunityRoute ? { name: group?.name || community?.name || "Community", handle: community?.name || "community", avatar: community?.image || "/Profilepic.png" } : user;

  async function send(extra = {}) {
    const body = extra.body || (extra.media?.type === "gif" ? { text: extra.media.url, messageType: "gif" } : { text, messageType: "text" });
    if (pendingFile && !extra.media) return sendFile();
    if (!body.text && body.messageType === "text") return;
    const url = isCommunityRoute ? `/api/communities/${communityId}/groups/${groupId}/messages` : "/api/chat/messages";
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isCommunityRoute ? body : { receiverId: id, ...body }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to send message");
    setMessages((prev) => prev.some((m) => m.id === data.message.id) ? prev : [...prev, toChatMessage(data.message, currentUserId)]);
    setText(""); setPendingFile(null); setError("");
  }

  async function sendFile() {
    if (!pendingFile) return;
    const isDoc = !pendingFile.type.startsWith("image") && !pendingFile.type.startsWith("video");
    await send({ body: isDoc ? { text: pendingFile.name, messageType: "document", attachment: pendingFile.upload } : { text, messageType: "media", attachments: [pendingFile.upload] } });
  }

  async function uploadAndPreview(file) {
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/chat/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to upload file");
    setPendingFile({ url: data.file.url, type: data.file.mimeType, name: data.file.fileName, upload: data.file });
  }

  async function react(msgId, emoji) {
    const url = isCommunityRoute ? `/api/communities/${communityId}/groups/${groupId}/messages` : "/api/chat/messages";
    const body = isCommunityRoute ? { action: "toggle-reaction", messageId: msgId, emoji } : { action: "toggle-reaction", messageId: msgId, emoji };
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, reactions: data.reactions || [] } : m));
  }

  async function handleDelete(scope) {
    const m = deleteTargetMessage; if (!m) return;
    const mode = scope === "everyone" ? "delete-for-everyone" : "delete-for-me";
    const url = isCommunityRoute ? `/api/communities/${communityId}/groups/${groupId}/messages` : `/api/chat/messages/${m.id}/${mode}`;
    const options = isCommunityRoute ? { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: m.id, mode: scope === "everyone" ? "for-everyone" : "for-me" }) } : { method: "POST" };
    const res = await fetch(url, options); const data = await res.json(); if (!res.ok || !data.ok) throw new Error(data.error || "Failed to delete");
    setMessages((prev) => scope === "everyone" ? prev.map((x) => x.id === m.id ? { ...x, deletedForEveryone: true, text: "" } : x) : prev.filter((x) => x.id !== m.id));
  }

  async function handleForward(targetIds) {
    await Promise.all(targetIds.map((targetId) => fetch(targetId.startsWith("community:") ? `/api/communities/${targetId.split(":")[1]}/groups/${targetId.split(":")[2]}/messages` : "/api/chat/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(targetId.startsWith("community:") ? { text: forwardTargetMessage.text, messageType: forwardTargetMessage.messageType || "text", attachment: forwardTargetMessage.attachment, attachments: forwardTargetMessage.attachments || [], sharedPost: forwardTargetMessage.sharedPost } : { receiverId: targetId, text: forwardTargetMessage.text, messageType: forwardTargetMessage.messageType || "text", attachment: forwardTargetMessage.attachment, attachments: forwardTargetMessage.attachments || [], sharedPost: forwardTargetMessage.sharedPost }) })));
  }

  const recipients = [...users.filter((u) => u.id !== currentUserId).map((u) => ({ id: u.id, name: u.name, subtitle: u.email, avatarUrl: u.image, kind: "dm" })), ...communities.flatMap((c) => (c.groups || []).map((g) => ({ id: `community:${c.id}:${g.id}`, name: g.name, communityName: c.name, subtitle: `${c.name} community`, avatarUrl: c.image, kind: "community" })) )];

  if (!header) return <div className="flex flex-1 items-center justify-center text-[#62748e]">Conversation not found</div>;

  return <>
    <header className="flex items-center justify-between border-b px-4 py-2.5" style={{ display: "flex", flexDirection: "row" }}>
      <div className="flex min-w-0 items-center gap-2"><Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa] md:hidden"><ArrowLeft className="h-5 w-5" /></Link><img src={header.avatar} alt={header.name} className="h-9 w-9 shrink-0 rounded-full bg-[#f2f6fa] object-cover" /><div className="flex min-w-0 items-center gap-1"><span className="truncate font-bold">{header.name}</span>{header.verified && <span className="shrink-0 text-[#1d9bf0]">✓</span>}</div></div>
      <div className="relative"><button onClick={() => setDots((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#536471] transition-all duration-200 hover:border-[#1d9bf0] hover:bg-[#e8f5fe] hover:text-[#1d9bf0] active:scale-95"><MoreHorizontal className="h-4 w-4" /></button>{dots && <DotsMenu onClose={() => setDots(false)} items={[{ label: "View profile", onClick: () => !isCommunityRoute && router.push(`/dashboard/Userprofile?userId=${id}`) }, { label: "Mute notifications" }, { label: "Report conversation", danger: true }]} />}</div>
    </header>
    <div ref={scrollRef} className="flex-1 overflow-y-auto"><div className="flex flex-col items-center gap-2 px-6 py-8"><img src={header.avatar} alt={header.name} className="h-20 w-20 rounded-full bg-[#f2f6fa] object-cover" /><div className="text-center"><div className="text-lg font-extrabold">{header.name}</div><div className="text-sm text-[#62748e]">@{header.handle}</div></div><button className="mt-2 rounded-full bg-[#000] px-5 py-1.5 text-sm font-bold text-[#fff] hover:opacity-90">View Profile</button></div>
      <div className="flex-1 overflow-y-auto px-4 py-6">{loading ? <div className="space-y-4">{[1,2,3].map((i)=><div key={i} className={cn("flex", i%2 ? "justify-end" : "justify-start")}><div className="h-10 w-40 animate-pulse rounded-2xl bg-[#f2f6fa]" /></div>)}</div> : <div className="space-y-4"><div className="text-center text-xs text-[#62748e]">Today</div>{messages.map((m)=>{ const mine = m.from === "me" || m.senderId === currentUserId; const showReact = reactingOn === m.id; return <div key={m.id} className={cn("group flex items-end gap-2", mine ? "justify-end" : "justify-start")}><div className="relative max-w-[70%]">{actionOpen===m.id && <div className={cn("absolute top-1/2 z-40 flex -translate-y-1/2 gap-1 rounded-full border bg-white p-1 shadow-xl", mine ? "right-full mr-2" : "left-full ml-2")}><button onClick={()=>setReactingOn(m.id)} className="rounded-full p-1.5 hover:bg-[#f2f6fa]"><Smile className="h-4 w-4" /></button><button onClick={()=>setForwardTargetMessage(m)} className="rounded-full p-1.5 hover:bg-[#f2f6fa]"><Undo2 className="h-4 w-4" /></button><button onClick={()=>setDeleteTargetMessage(m)} className="rounded-full p-1.5 hover:bg-[#f2f6fa]"><Trash2 className="h-4 w-4" /></button></div>}{m.deletedForEveryone ? <div className={cn("inline-flex rounded-2xl px-3.5 py-2 text-[15px] italic", mine ? "bg-[#1d9bf0] text-white" : "bg-[#f2f6fa] text-[#62748e]")}>This message was deleted</div> : <>{m.media?.type === "image" && <img src={m.media.url} alt="" className="mb-1 max-h-80 rounded-2xl object-cover shadow-sm" />}{m.media?.type === "video" && <video src={m.media.url} controls className="mb-1 max-h-80 rounded-2xl" />}{m.media?.type === "gif" && <img src={m.media.url} alt="gif" className="mb-1 max-h-60 rounded-2xl" />}{m.text && m.messageType !== "gif" && <button onMouseEnter={()=>setActionOpen(m.id)} onMouseLeave={()=>setActionOpen(null)} onClick={()=>setActionOpen(actionOpen===m.id?null:m.id)} className={cn("inline-flex items-end gap-2 rounded-2xl px-3.5 py-2 text-left text-[15px] animate-fade-in", mine ? "bg-[#1d9bf0] text-white" : "bg-[#f2f6fa] text-[#62748e]")}><span className="whitespace-pre-wrap break-words">{m.text}</span><span className={cn("shrink-0 text-[11px]", mine ? "text-white/80" : "text-[#62748e]")}>{m.time}</span>{mine && m.readAt && <CheckCircle2 className="h-3 w-3 text-white/90" />}</button>}</>}{m.reactions?.length>0 && <div className={cn("-mt-2 inline-flex rounded-full border bg-[#fff] px-2 py-0.5 text-sm shadow", mine ? "float-right" : "float-left")}>{m.reactions.map((r)=>r.emoji).join(" ")}</div>}{showReact && <ReactionPicker align={mine ? "right" : "left"} onClose={()=>setReactingOn(null)} onPick={(e)=>react(m.id,e)} />}</div></div>})}<div className="text-center text-xs text-[#62748e]">This conversation is now end-to-end encrypted</div></div>}</div>
    </div>
    <button onClick={()=>scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })} className="absolute bottom-28 right-[400px] hidden rounded-full border bg-[#fff] p-2 shadow-md hover:bg-[#f2f6fa] md:block"><ArrowDown className="h-4 w-4" /></button>
    {pendingFile && <MediaPreviewBar file={pendingFile} onRemove={()=>setPendingFile(null)} />}
    {recording ? <VoiceRecorder onClose={()=>setRecording(false)} /> : <div className="border-t bg-[#fff] p-3"><div className="flex items-end gap-2 rounded-3xl bg-[#f2f6fa] px-3 py-2"><div className="relative"><button onClick={()=>setPlusOpen((v)=>!v)} className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"><Plus className="h-5 w-5" /></button>{plusOpen && <PlusDropdown onClose={()=>setPlusOpen(false)} onPickFile={(f)=>uploadAndPreview(f).catch((e)=>setError(e.message))} />}</div><button onClick={()=>setPicker(picker==="gif"?null:"gif")} className="flex h-9 items-center justify-center rounded-md border border-[#1d9bf0]/50 px-1.5 text-[11px] font-extrabold text-[#1d9bf0] hover:bg-[#1d9bf0]/10">GIF</button><button onClick={()=>setPicker(picker==="emoji"?null:"emoji")} className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"><Smile className="h-5 w-5" /></button><textarea value={text} rows={1} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send().catch((err)=>setError(err.message)); } }} placeholder="Start a new message" className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none" />{text || pendingFile ? <button onClick={()=>send().catch((err)=>setError(err.message))} className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"><Icon icon="ri:send-ins-line" className="h-5 w-5" /></button> : <button onClick={()=>setRecording(true)} className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"><Mic className="h-5 w-5" /></button>}<PickerPopover type={picker} onClose={()=>setPicker(null)} onPick={(val)=>{ if(picker==="emoji") setText((t)=>t+val); else if(picker==="gif") send({ media: { type: "gif", url: val } }).catch((err)=>setError(err.message)); }} /></div>{error && <p className="px-3 pt-2 text-sm text-red-500">{error}</p>}</div>}
    {call && <CallModal open onClose={()=>setCall(null)} user={header} video={call === "video"} />}
    <DeleteMessageModal open={!!deleteTargetMessage} onOpenChange={(open)=>!open&&setDeleteTargetMessage(null)} onConfirm={handleDelete} canDeleteForEveryone={(deleteTargetMessage?.sender === currentUserId) || (deleteTargetMessage?.senderId === currentUserId)} />
    <ForwardMessageModal open={!!forwardTargetMessage} onOpenChange={(open)=>!open&&setForwardTargetMessage(null)} message={forwardTargetMessage} recipients={recipients} onForward={handleForward} />
  </>;
}
