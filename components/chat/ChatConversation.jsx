"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { MoreHorizontal, Plus, Smile, Mic, ArrowDown, ArrowLeft, CheckCircle2, Trash2, Undo2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { PlusDropdown, ReactionPicker, MediaPreviewBar, VoiceRecorder, CallModal, DotsMenu, BlockUserModal } from "@/components/chat/chat-ui";
import { BlockedModal } from "@/components/BlockedModal";
import { DeleteMessageModal } from "@/components/DeleteMessageModal";
import { ForwardMessageModal } from "@/components/ForwardMessageModal";
import { cn } from "@/lib/utils";
import { getPusherClient } from "@/lib/usePusher";
import ChatGiphyPicker from "@/components/shared/ChatGiphyPicker";

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "long" });

function getDateKey(date) {
    const value = date instanceof Date ? date : new Date(date || Date.now());
    if (Number.isNaN(value.getTime())) return getDateKey(new Date());
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDateCapsule(date) {
    const value = date instanceof Date ? date : new Date(date || Date.now());
    const safeDate = Number.isNaN(value.getTime()) ? new Date() : value;
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (getDateKey(safeDate) === getDateKey(today)) return "Today";
    if (getDateKey(safeDate) === getDateKey(yesterday)) return "Yesterday";

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    if (safeDate >= sevenDaysAgo) return weekdayFormatter.format(safeDate);
    return dateFormatter.format(safeDate);
}

function toChatMessage(msg, currentUserId) {
    const senderId = String(msg.senderId || msg.sender || "");
    const mine = senderId === String(currentUserId);
    const firstAttachment = msg.attachments?.[0] || msg.attachment;
    const media = msg.messageType === "gif"
        ? { type: "gif", url: msg.text }
        : msg.messageType === "media" && firstAttachment?.url
            ? { type: firstAttachment.mimeType?.startsWith("video/") ? "video" : "image", url: firstAttachment.url }
            : null;
    const createdAt = msg.createdAt || Date.now();
    return { ...msg, senderId, from: mine ? "me" : senderId, createdAt, dateKey: getDateKey(createdAt), time: new Date(createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), media };
}

const fallbackAvatar = (seed) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed || "User")}`;
const quickTime = (date) => new Date(date || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function ChatConversation({ id, communityId, groupId, requestMode = false, onRequestBlock, onBack }) {
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
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [blockedBy, setBlockedBy] = useState([]);
    const [showBlockUserModal, setShowBlockUserModal] = useState(false);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteTargetMessage, setDeleteTargetMessage] = useState(null);
    const [forwardTargetMessage, setForwardTargetMessage] = useState(null);
    const scrollRef = useRef(null);

    const activeUser = useMemo(() => users.find((u) => u.id === id), [users, id]);
    const isCommunityRoute = Boolean(communityId && groupId);

    useEffect(() => {
        async function bootstrap() {
            const [userRes, communityRes] = await Promise.all([fetch("/api/chat/users", { cache: "no-store" }), fetch("/api/communities", { cache: "no-store" })]);
            const userData = await userRes.json();
            const communityData = await communityRes.json();
            if (userRes.ok) {
                setUsers(userData.users || []);
                setCurrentUserId(userData.currentUserId || "");
                setBlockedUsers(userData.blockedUsers || []);
                setBlockedBy(userData.blockedBy || []);
            }
            if (communityRes.ok) setCommunities(communityData.communities || []);
        }
        bootstrap().catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        const hasConversation = isCommunityRoute ? communityId && groupId : id;
        if (!hasConversation || !currentUserId) return;
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
        if (!activeUser?.id) {
            setShowBlockedModal(false);
            return;
        }
        setShowBlockedModal(blockedBy.includes(activeUser.id));
    }, [activeUser, blockedBy]);

    useEffect(() => {
        if (!currentUserId) return;
        let channel;
        let mounted = true;
        getPusherClient().then((pusher) => {
            if (!pusher || !mounted) return;
            channel = pusher.subscribe(isCommunityRoute ? `private-community-${communityId}` : `private-user-${currentUserId}`);
            channel.bind("new-message", (incoming) => {
                const incomingSender = String(incoming.senderId || incoming.sender || "");
                const incomingReceiver = String(incoming.receiverId || incoming.receiver || "");
                const inThread = isCommunityRoute ? incoming.communityId === communityId && incoming.groupId === groupId : ((incomingSender === id && incomingReceiver === currentUserId) || (incomingSender === currentUserId && incomingReceiver === id));
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
    const isConversationBlocked = !isCommunityRoute && id && (blockedUsers.includes(id) || blockedBy.includes(id));
    const blockedLabel = blockedUsers.includes(id) ? "You have blocked this user. Unblock to message." : "You are blocked by this user. Unblock cannot send messages.";

    async function send(extra = {}) {
        if (isConversationBlocked) return;
        const body = extra.body || (extra.media?.type === "gif" ? { text: extra.media.url, messageType: "gif" } : { text, messageType: "text" });
        // Avoid infinite recursion: only call sendFile when there is no explicit body provided
        if (pendingFile && !extra.media && !extra.body) return sendFile();
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

    async function handleToggleBlock(action) {
        if (!id || isCommunityRoute) return;
        setBlockLoading(true);
        try {
            const response = await fetch("/api/chat/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: id, action }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to toggle block status");
            setBlockedUsers(data.blockedUsers || []);
            setError("");
            if (action === "block") {
                setShowBlockUserModal(false);
            }
        } catch (err) {
            setError(err.message || "Failed to toggle block status");
        } finally {
            setBlockLoading(false);
        }
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
        await Promise.all(targetIds.map((targetId) => {
            const target = recipients.find((recipient) => recipient.id === targetId);
            if (!target) return Promise.resolve();
            const message = { text: forwardTargetMessage.text, messageType: forwardTargetMessage.messageType || "text", attachment: forwardTargetMessage.attachment, attachments: forwardTargetMessage.attachments || [], sharedPost: forwardTargetMessage.sharedPost };
            const isCommunity = target.kind === "community";
            const url = isCommunity ? `/api/communities/${target.communityId}/groups/${target.groupId}/messages` : "/api/chat/messages";
            return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isCommunity ? message : { receiverId: target.id, ...message }) });
        }));
    }

    const recipients = [...users.filter((u) => u.id !== currentUserId).map((u) => ({ id: u.id, name: u.name, subtitle: u.email, avatarUrl: u.image, kind: "dm" })), ...communities.flatMap((c) => (c.groups || []).map((g) => ({ id: `group:${c.id}:${g.id}`, communityId: c.id, groupId: g.id, name: g.name, communityName: c.name, subtitle: `${c.name} community`, avatarUrl: c.image, kind: "community" })))];

    if (!header) return <div className="flex flex-1 items-center justify-center text-[#62748e]">Conversation not found</div>;

    return <>
        <header className="flex items-center justify-between border-b px-4 py-2.5" style={{ display: "flex", flexDirection: "row" }}>
            <div className="flex min-w-0 items-center gap-2">{onBack ? <button onClick={onBack} className="rounded-full p-2 hover:bg-[#f2f6fa] md:hidden"><ArrowLeft className="h-5 w-5" /></button> : <Link href="/dashboard/chat2" className="rounded-full p-2 hover:bg-[#f2f6fa] md:hidden"><ArrowLeft className="h-5 w-5" /></Link>}<img src={header.avatar} alt={header.name} className="h-9 w-9 shrink-0 border rounded-full bg-[#f2f6fa] object-cover" /><div className="flex min-w-0 items-center gap-1"><span className="truncate font-bold">{header.name}</span>{header.verified && <span className="shrink-0 text-[#1d9bf0]">✓</span>}</div></div>
            <div className="relative"><button onClick={() => setDots((v) => !v)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#536471] transition-all duration-200 hover:border-[#1d9bf0] hover:bg-[#e8f5fe] hover:text-[#1d9bf0] active:scale-95"><MoreHorizontal className="h-4 w-4" /></button>{dots && <DotsMenu onClose={() => setDots(false)} items={requestMode ? [{ label: "Report user", danger: true }, { label: "Block user", danger: true, onClick: () => setShowBlockUserModal(true) }] : [{ label: "View profile", onClick: () => !isCommunityRoute && router.push(`/dashboard/Userprofile?userId=${id}`) }, { label: blockedUsers.includes(id) ? "Unblock user" : "Block user", onClick: () => { if (blockedUsers.includes(id)) { handleToggleBlock("unblock"); } else { setShowBlockUserModal(true); } } }, { label: "Report conversation", danger: true }]} />}</div>
        </header>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto"><div className="flex flex-col items-center gap-2 px-6 py-8"><img src={header.avatar} alt={header.name} className="h-20 w-20 rounded-full bg-[#f2f6fa] border object-cover" /><div className="text-center"><div className="text-lg font-extrabold">{header.name}</div><div className="text-sm text-[#62748e]">@{header.handle}</div></div><button className="mt-2 rounded-full bg-[#000] px-5 py-1.5 text-sm font-bold text-[#fff] hover:opacity-90">View Profile</button></div>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">{loading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className={cn("flex", i % 2 ? "justify-end" : "justify-start")}><div className="h-10 w-40 animate-pulse rounded-2xl bg-[#f2f6fa]" /></div>)}</div> : <div className="space-y-4">{messages.map((m, index) => {
                const mine = m.from === "me" || m.senderId === currentUserId; const showReact = reactingOn === m.id; const showDateCapsule = index === 0 || messages[index - 1]?.dateKey !== m.dateKey; return <div
                    key={m.id}
                    onMouseEnter={() => setActionOpen(m.id)}
                    onMouseLeave={() => {
                        setActionOpen(null);
                        setReactingOn(null);
                    }}
                    className="w-full"
                >{showDateCapsule && <div className="mb-3 mt-2 flex justify-center text-xs text-[#62748e]"><div className="w-fit rounded-full bg-gray-100 px-3 py-1 font-medium">{formatDateCapsule(m.createdAt)}</div></div>}<div className={cn(
                    "group flex w-full items-end gap-2 py-1",
                    mine ? "justify-end pr-6" : "justify-start pl-6"
                )}><div
                    className="relative max-w-[70%]">{actionOpen === m.id && <div
                        className={cn(
                            "absolute top-1 z-50 flex items-center gap-0.5 rounded-full border border-gray-200 bg-white px-1 py-1",
                            mine ? "right-full mr-1.5" : "left-full ml-1.5"
                        )}
                    ><button
                        onClick={() => setReactingOn(m.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[#f2f6fa]"
                    >
                            <Smile className="h-4 w-4 shrink-0" strokeWidth={2} />
                        </button>

                        <button
                            onClick={() => setForwardTargetMessage(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[#f2f6fa]"
                        >
                            <Undo2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                        </button>

                        <button
                            onClick={() => setDeleteTargetMessage(m)}
                            className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[#f2f6fa]"
                        >
                            <Trash2 className="h-4 w-4 shrink-0 text-red-500" strokeWidth={2} />
                        </button></div>}{m.deletedForEveryone ? <div className={cn("inline-flex rounded-2xl px-3.5 py-2 text-[15px] italic", mine ? "bg-[#1d9bf0] rounded-br-[7px] text-white" : "bg-[#f2f6fa] rounded-bl-[7px] text-[#62748e]")}>This message was deleted</div> : <>{m.media?.type === "image" && <img src={m.media.url} alt="" className="mb-1 max-h-80 rounded-2xl object-cover shadow-sm" />}{m.media?.type === "video" && <video src={m.media.url} controls className="mb-1 max-h-80 rounded-2xl" />}{m.media?.type === "gif" && <img src={m.media.url} alt="gif" className="mb-1 max-h-60 rounded-2xl" />}{m.text && m.messageType !== "gif" && <button onClick={() => setActionOpen(actionOpen === m.id ? null : m.id)} className={cn("inline-flex items-end gap-2 rounded-2xl px-3.5 py-2 text-left text-[15px] animate-fade-in", mine ? "bg-[#1d9bf0] rounded-br-[7px] text-white" : "bg-[#f2f6fa] rounded-bl-[7px] text-[#62748e]")}><span className="whitespace-pre-wrap break-words">{m.text}</span><span className={cn("shrink-0 text-[11px]", mine ? "text-white/80" : "text-[#62748e]")}>{m.time}</span>{mine && m.readAt && <CheckCircle2 className="h-3 w-3 text-white/90" />}</button>}</>}{m.reactions?.length > 0 && (
                            <div
                                className={cn(
                                    "absolute -bottom-5 z-20 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 shadow-md",
                                    mine
                                        ? "right-3 translate-x-1/4"
                                        : "left-3 -translate-x-1/4"
                                )}
                            >
                                {m.reactions.map((r) => r.emoji).join(" ")}
                            </div>
                        )}{showReact && <ReactionPicker align={mine ? "right" : "left"} onClose={() => setReactingOn(null)} onPick={(e) => react(m.id, e)} />}</div></div></div>
            })}<div className="text-center flex justify-center gap-1 text-xs text-[#62748e]"><Icon icon="solar:lock-linear" /> This conversation is now end-to-end encrypted</div></div>}</div>
        </div>
        <button
            onClick={() =>
                scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                })
            }
            className="absolute bottom-28 right-[400px] hidden rounded-full border bg-[#fff] p-2 shadow-md hover:bg-[#f2f6fa] md:block"
        >
            <ArrowDown className="h-4 w-4" />
        </button>

        {pendingFile && (
            <MediaPreviewBar
                file={pendingFile}
                onRemove={() => setPendingFile(null)}
            />
        )}

        {!requestMode && (recording ? (
            <VoiceRecorder onClose={() => setRecording(false)} />
        ) : (
            <div className="border-t bg-[#fff] p-3">
                <div className="flex items-end gap-2 rounded-3xl bg-[#f2f6fa] px-3 py-2">
                    <div className="relative">
                        <button
                            disabled={isConversationBlocked}
                            onClick={() => setPlusOpen((v) => !v)}
                            className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                        >
                            <Plus className="h-5 w-5" />
                        </button>

                        {plusOpen && !isConversationBlocked && (
                            <PlusDropdown
                                onClose={() => setPlusOpen(false)}
                                onPickFile={(f) =>
                                    uploadAndPreview(f).catch((e) => setError(e.message))
                                }
                            />
                        )}
                    </div>

                    <button
                        disabled={isConversationBlocked}
                        onClick={() => setPicker(picker === "gif" ? null : "gif")}
                        className="flex h-9 items-center justify-center rounded-md border border-[#1d9bf0]/50 px-1.5 text-[11px] font-extrabold text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                    >
                        GIF
                    </button>

                    <button
                        disabled={isConversationBlocked}
                        onClick={() => setPicker(picker === "emoji" ? null : "emoji")}
                        className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                    >
                        <Smile className="h-5 w-5" />
                    </button>

                    <textarea
                        value={text}
                        rows={1}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (!isConversationBlocked) {
                                    send().catch((err) => setError(err.message));
                                }
                            }
                        }}
                        placeholder={
                            isConversationBlocked
                                ? blockedLabel
                                : "Start a new message"
                        }
                        disabled={isConversationBlocked}
                        className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none"
                    />

                    {text || pendingFile ? (
                        <button
                            disabled={isConversationBlocked}
                            onClick={() =>
                                !isConversationBlocked &&
                                send().catch((err) => setError(err.message))
                            }
                            className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                        >
                            <Icon
                                icon="ri:send-ins-line"
                                className="h-5 w-5"
                            />
                        </button>
                    ) : (
                        <button
                            disabled={isConversationBlocked}
                            onClick={() => setRecording(true)}
                            className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                        >
                            <Mic className="h-5 w-5" />
                        </button>
                    )}

                    {picker === "emoji" && (
                        <div className="absolute bottom-20 left-14 z-50 rounded-2xl border bg-white shadow-2xl">
                            <EmojiPicker
                                onEmojiClick={(emojiData) => {
                                    if (emojiData?.emoji) {
                                        setText((t) => `${t}${emojiData.emoji}`);
                                    }
                                    setPicker(null);
                                }}
                                width={340}
                                height={380}
                                lazyLoadEmojis
                            />
                        </div>
                    )}

                    {picker === "gif" && (
                        <div className="absolute bottom-20 left-14 z-50 h-[420px] w-[360px] overflow-hidden rounded-2xl border bg-white shadow-2xl">
                            <ChatGiphyPicker
                                width={340}
                                columns={2}
                                onSelect={(val) => {
                                    setPicker(null);
                                    if (!isConversationBlocked) {
                                        send({
                                            media: {
                                                type: "gif",
                                                url: val,
                                            },
                                        }).catch((err) => setError(err.message));
                                    }
                                }}
                            />
                        </div>
                    )}

                    {picker && (
                        <button
                            type="button"
                            aria-label="Close picker"
                            className="fixed inset-0 z-40 cursor-default"
                            onClick={() => setPicker(null)}
                        />
                    )}
                </div>

                {error && (
                    <p className="px-3 pt-2 text-sm text-red-500">
                        {error}
                    </p>
                )}
            </div>
            
        ))}

        {call && (
            <CallModal
                open
                onClose={() => setCall(null)}
                user={header}
                video={call === "video"}
            />
        )}

        <DeleteMessageModal
            open={!!deleteTargetMessage}
            onOpenChange={(open) => !open && setDeleteTargetMessage(null)}
            onConfirm={handleDelete}
            canDeleteForEveryone={
                deleteTargetMessage?.sender === currentUserId ||
                deleteTargetMessage?.senderId === currentUserId
            }
        />

        <ForwardMessageModal
            open={!!forwardTargetMessage}
            onOpenChange={(open) => !open && setForwardTargetMessage(null)}
            message={forwardTargetMessage}
            recipients={recipients}
            onForward={handleForward}
        />

        <BlockUserModal
            open={showBlockUserModal}
            onOpenChange={setShowBlockUserModal}
            onConfirm={() => handleToggleBlock("block").then(() => onRequestBlock?.())}
            userName={activeUser?.name}
        />

        <BlockedModal
            open={showBlockedModal}
            onOpenChange={setShowBlockedModal}
            userName={activeUser?.name}
        />
    </>;
}
