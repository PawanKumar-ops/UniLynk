"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    Phone,
    Video as VideoIcon,
    MoreHorizontal,
    Plus,
    Image as ImageIcon,
    Smile,
    Mic,
    Send,
    ArrowDown,
    ArrowLeft,
    CheckCircle2,
} from "lucide-react";

import { conversations } from "@/lib/mock-data";
import {
    PickerPopover,
    PlusDropdown,
    ReactionPicker,
    MediaPreviewBar,
    VoiceRecorder,
    CallModal,
    DotsMenu,
} from "@/components/chat/chat-ui";
import { cn } from "@/lib/utils";

export default function ChatRoute() {
    const params = useParams();
    const id = params?.id;
    const router = useRouter();
    const initial = conversations.find((c) => c.id === id);

    const [messages, setMessages] = useState(initial?.messages ?? []);
    const [text, setText] = useState("");
    const [picker, setPicker] = useState(null);
    const [plusOpen, setPlusOpen] = useState(false);
    const [reactingOn, setReactingOn] = useState(null);
    const [dots, setDots] = useState(false);
    const [call, setCall] = useState(null);
    const [pendingFile, setPendingFile] = useState(null);
    const [recording, setRecording] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        const t = setTimeout(() => setLoading(false), 400);
        setMessages(initial?.messages ?? []);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages, loading]);

    if (!initial) {
        return (
            <div className="flex flex-1 items-center justify-center text-[#62748e]">
                Conversation not found
            </div>
        );
    }
    const user = initial.user;

    function send(extra) {
        const m = {
            id: crypto.randomUUID(),
            from: "me",
            text: text || extra?.text,
            time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            ...extra,
        };
        if (!m.text && !m.media) return;
        setMessages((prev) => [...prev, m]);
        setText("");
        setPendingFile(null);
        // simulate reply
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    from: user.id,
                    text: "👌",
                    time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                },
            ]);
        }, 1200);
    }

    function sendFile() {
        if (!pendingFile) return;
        const type = pendingFile.type.startsWith("video") ? "video" : "image";
        send({ media: { type, url: pendingFile.url } });
    }

    function react(msgId, emoji) {
        setMessages((prev) =>
            prev.map((m) =>
                m.id === msgId
                    ? {
                        ...m,
                        reactions: [...(m.reactions || []).filter((r) => r.by !== "me"), { emoji, by: "me" }],
                    }
                    : m,
            ),
        );
    }

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between border-b px-4 py-2.5"
            style={{
                    display: "flex",
                    flexDirection: "row",
                }}>
                <div className="flex min-w-0 items-center gap-2">
                    <Link
                        href="/dashboard/chat2"
                        className="rounded-full p-2 hover:bg-[#f2f6fa] md:hidden"
                        title="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-9 w-9 shrink-0 rounded-full bg-[#f2f6fa] object-cover"
                    />
                    <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate font-bold">{user.name}</span>
                        {user.verified && <span className="shrink-0 text-[#1d9bf0]">✓</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCall("voice")}
                        className="rounded-full bg-[#f2f6fa] p-2.5 hover:opacity-80"
                        title="Voice call"
                    >
                        <Phone className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setCall("video")}
                        className="rounded-full bg-[#f2f6fa] p-2.5 hover:opacity-80"
                        title="Video call"
                    >
                        <VideoIcon className="h-4 w-4" />
                    </button>
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
                                    { label: "View profile" },
                                    { label: "Mute notifications" },
                                    { label: "Snooze notifications" },
                                    { label: "Leave conversation" },
                                    { label: "Block @" + user.handle, danger: true },
                                    { label: "Report conversation", danger: true },
                                ]}
                            />
                        )}
                    </div>
                </div>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
                {/* Profile card */}
                <div className="flex flex-col items-center gap-2 border-b px-6 py-8">
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-20 w-20 rounded-full bg-[#f2f6fa] object-cover"
                    />
                    <div className="text-center">
                        <div className="text-lg font-extrabold">{user.name}</div>
                        <div className="text-sm text-[#62748e]">@{user.handle}</div>
                        <div className="text-sm text-[#62748e]">
                            <strong className="text-[#000]">{user.followers}</strong> Followers · Joined{" "}
                            {user.joined}
                        </div>
                    </div>
                    <button className="mt-2 rounded-full bg-[#000] px-5 py-1.5 text-sm font-bold text-[#fff] hover:opacity-90">
                        View Profile
                    </button>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={cn("flex", i % 2 ? "justify-end" : "justify-start")}
                                >
                                    <div className="h-10 w-40 animate-pulse rounded-2xl bg-[#f2f6fa]" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center text-xs text-[#62748e]">Today</div>
                            {messages.map((m, i) => {
                                const mine = m.from === "me";
                                const showReact = reactingOn === m.id;
                                const prev = messages[i - 1];
                                const dayBreak =
                                    prev && prev.time?.includes("AM") !== m.time?.includes("AM");
                                return (
                                    <div key={m.id}>
                                        {dayBreak && (
                                            <div className="my-3 text-center text-xs text-[#62748e]">
                                                {m.time}
                                            </div>
                                        )}
                                        <div className={cn("group flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                                            <div className="relative max-w-[70%]">
                                                {m.media?.type === "image" && (
                                                    <img
                                                        src={m.media.url}
                                                        alt=""
                                                        className="mb-1 max-h-80 rounded-2xl object-cover shadow-sm"
                                                    />
                                                )}
                                                {m.media?.type === "video" && (
                                                    <video
                                                        src={m.media.url}
                                                        controls
                                                        className="mb-1 max-h-80 rounded-2xl"
                                                    />
                                                )}
                                                {m.media?.type === "gif" && (
                                                    <img src={m.media.url} alt="gif" className="mb-1 max-h-60 rounded-2xl" />
                                                )}
                                                {m.text && (
                                                    <div
                                                        className={cn(
                                                            "inline-flex items-end gap-2 rounded-2xl px-3.5 py-2 text-[15px] animate-fade-in",
                                                            mine
                                                                ? "bg-[#1d9bf0] text-white"
                                                                : "bg-[#f2f6fa] text-[#62748e]",
                                                        )}
                                                    >
                                                        <span className="whitespace-pre-wrap break-words">{m.text}</span>
                                                        <span
                                                            className={cn(
                                                                "shrink-0 text-[11px]",
                                                                mine ? "text-white/80" : "text-[#62748e]",
                                                            )}
                                                        >
                                                            {m.time}
                                                        </span>
                                                        {mine && m.seen && (
                                                            <CheckCircle2 className="h-3 w-3 text-white/90" />
                                                        )}
                                                    </div>
                                                )}
                                                {m.reactions && m.reactions.length > 0 && (
                                                    <div
                                                        className={cn(
                                                            "-mt-2 inline-flex rounded-full border bg-[#fff] px-2 py-0.5 text-sm shadow",
                                                            mine ? "float-right" : "float-left",
                                                        )}
                                                    >
                                                        {m.reactions.map((r) => r.emoji).join(" ")}
                                                    </div>
                                                )}
                                                {showReact && (
                                                    <ReactionPicker
                                                        align={mine ? "right" : "left"}
                                                        onClose={() => setReactingOn(null)}
                                                        onPick={(e) => react(m.id, e)}
                                                    />
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setReactingOn(m.id)}
                                                className="opacity-0 transition group-hover:opacity-100"
                                                title="React"
                                            >
                                                <Smile className="h-4 w-4 text-[#62748e]" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="text-center text-xs text-[#62748e]">
                                This conversation is now end-to-end encrypted
                            </div>
                        </div>
                    )}
                </div>

                </div>

                {/* Scroll-to-bottom */}
                <button
                    onClick={() =>
                        scrollRef.current?.scrollTo({
                            top: scrollRef.current.scrollHeight,
                            behavior: "smooth",
                        })
                    }
                    className="absolute bottom-28 right-[400px] hidden rounded-full border bg-[#fff] p-2 shadow-md hover:bg-[#f2f6fa] md:block"
                    title="Scroll to bottom"
                >
                    <ArrowDown className="h-4 w-4" />
                </button>

                {/* Pending media preview */}
                {pendingFile && (
                    <MediaPreviewBar
                        file={pendingFile}
                        onRemove={() => setPendingFile(null)}
                    />
                )}

                {/* Composer */}
                {recording ? (
                    <VoiceRecorder onClose={() => setRecording(false)} />
                ) : (
                    <div className="border-t bg-[#fff] p-3">
                        <div className="flex items-end gap-2 rounded-3xl bg-[#f2f6fa] px-3 py-2">
                            <div className="relative">
                                <button
                                    onClick={() => setPlusOpen((v) => !v)}
                                    className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                                {plusOpen && (
                                    <PlusDropdown
                                        onClose={() => setPlusOpen(false)}
                                        onPickFile={(f) =>
                                            setPendingFile({
                                                url: URL.createObjectURL(f),
                                                type: f.type,
                                                name: f.name,
                                            })
                                        }
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => setPicker(picker === "gif" ? null : "gif")}
                                className="flex h-9 items-center justify-center rounded-md border border-[#1d9bf0]/50 px-1.5 text-[11px] font-extrabold text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                title="GIF"
                            >
                                GIF
                            </button>
                            <button
                                onClick={() => setPicker(picker === "sticker" ? null : "sticker")}
                                className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                title="Sticker"
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
                                        if (pendingFile) sendFile();
                                        else send();
                                    }
                                }}
                                placeholder="Start a new message"
                                className="max-h-32 flex-1 resize-none bg-transparent py-2 text-[15px] outline-none"
                            />
                            <button
                                onClick={() => setPicker(picker === "emoji" ? null : "emoji")}
                                className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                title="Emoji"
                            >
                                <Smile className="h-5 w-5" />
                            </button>
                            {text || pendingFile ? (
                                <button
                                    onClick={() => (pendingFile ? sendFile() : send())}
                                    className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                    title="Send"
                                >
                                    <Send className="h-5 w-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setRecording(true)}
                                    className="rounded-full p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10"
                                    title="Voice message"
                                >
                                    <Mic className="h-5 w-5" />
                                </button>
                            )}
                            <PickerPopover
                                type={picker}
                                onClose={() => setPicker(null)}
                                onPick={(val) => {
                                    if (picker === "emoji") setText((t) => t + val);
                                    else if (picker === "gif") send({ media: { type: "gif", url: val } });
                                    else if (picker === "sticker") send({ media: { type: "image", url: val } });
                                }}
                            />
                        </div>
                    </div>
                )}

                {call && (
                    <CallModal
                        open
                        onClose={() => setCall(null)}
                        user={user}
                        video={call === "video"}
                    />
                )}
            </>
            );
}
