"use client"

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    FileSpreadsheet,
    Mail,
    Plus,
    Upload,
    X,
} from "lucide-react";
import * as XLSX from "xlsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uid = () => Math.random().toString(36).slice(2, 10);

export function AddMembersModal({ open, onOpenChange, onAdd }) {
    const [members, setMembers] = useState([]);
    const [manualEmail, setManualEmail] = useState("");
    const [fileName, setFileName] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const [mode, setMode] = useState("upload");
    const [success, setSuccess] = useState(null);
    const fileInputRef = useRef(null);

    const reset = () => {
        setMembers([]);
        setManualEmail("");
        setFileName(null);
        setError(null);
        setMode("upload");
        setSuccess(null);
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(reset, 250);
    };

    const addManual = () => {
        const value = manualEmail.trim().toLowerCase();
        if (!value) return;
        if (!EMAIL_RE.test(value)) return setError("Invalid email");
        if (members.some((m) => m.email === value))
            return setError("Already added");
        setError(null);
        setMembers((m) => [{ id: uid(), email: value, source: "manual" }, ...m]);
        setManualEmail("");
    };

    const handleFile = useCallback(async (file) => {
        setError(null);
        setFileName(file.name);
        try {
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const emailKey =
                rows.length > 0
                    ? Object.keys(rows[0]).find((k) => k.toLowerCase().includes("email"))
                    : undefined;
            const collected = new Set();
            rows.forEach((row) => {
                const candidates = emailKey ? [row[emailKey]] : Object.values(row);
                candidates.forEach((c) => {
                    const str = String(c ?? "").trim().toLowerCase();
                    if (EMAIL_RE.test(str)) collected.add(str);
                });
            });
            if (collected.size === 0) return setError("No valid emails found");
            setMembers((prev) => {
                const existing = new Set(prev.map((m) => m.email));
                const fresh = [...collected]
                    .filter((e) => !existing.has(e))
                    .map((email) => ({ id: uid(), email, source: "excel" }));
                return [...fresh, ...prev];
            });
        } catch {
            setError("Couldn't read this file");
        }
    }, []);

    const handleAddAll = () => {
        if (members.length === 0) return;
        onAdd?.(members.map((m) => m.email));
        setSuccess(members.length);
    };

    const removeMember = (id) =>
        setMembers((m) => m.filter((x) => x.id !== id));

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-md"
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        onClick={handleClose}
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]"
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                    >
                        <AnimatePresence mode="wait">
                            {success !== null ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center px-6 py-10 text-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0.4, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black text-white"
                                    >
                                        <Check className="h-6 w-6" strokeWidth={2.5} />
                                        <motion.span
                                            className="absolute inset-0 rounded-full border border-black/20"
                                            initial={{ scale: 1, opacity: 0.6 }}
                                            animate={{ scale: 1.6, opacity: 0 }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                        />
                                    </motion.div>
                                    <h3 className="mt-4 text-black">All set</h3>
                                    <p className="mt-1 text-sm text-black/55">
                                        {success} {success === 1 ? "member was" : "members were"}{" "}
                                        added to the club.
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="mt-5 h-10 rounded-xl bg-black px-5 text-sm text-white transition hover:bg-black/85"
                                    >
                                        Done
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="flex items-center justify-between px-5 pt-5">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-black font-bold">Add members</h2>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="rounded-full p-1 text-black/40 transition hover:bg-black/5 hover:text-black"
                                            aria-label="Close"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="px-5 pt-4">
                                        <div className="relative flex rounded-lg bg-black/[0.06] p-0.5">
                                            <motion.div
                                                layout
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 32,
                                                }}
                                                className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-sm"
                                                style={{ left: mode === "upload" ? 2 : "50%" }}
                                            />
                                            {[
                                                { id: "upload", label: "Upload", Icon: FileSpreadsheet },
                                                { id: "manual", label: "Manual", Icon: Mail },
                                            ].map(({ id, label, Icon }) => (
                                                <button
                                                    key={id}
                                                    onClick={() => {
                                                        setMode(id);
                                                        setError(null);
                                                    }}
                                                    className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs transition ${mode === id ? "text-black" : "text-black/50"
                                                        }`}
                                                >
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mt-4">
                                            <AnimatePresence mode="wait">
                                                {mode === "upload" ? (
                                                    <motion.label
                                                        key="upload"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(true);
                                                        }}
                                                        onDragLeave={() => setIsDragging(false)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            setIsDragging(false);
                                                            const f = e.dataTransfer.files?.[0];
                                                            if (f) handleFile(f);
                                                        }}
                                                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${isDragging
                                                            ? "border-black bg-black/[0.03]"
                                                            : "border-black/15 hover:border-black/40 hover:bg-black/[0.02]"
                                                            }`}
                                                    >
                                                        <input
                                                            ref={fileInputRef}
                                                            type="file"
                                                            accept=".xlsx,.xls,.csv"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const f = e.target.files?.[0];
                                                                if (f) handleFile(f);
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                        <motion.div
                                                            animate={{ y: isDragging ? -2 : 0 }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"
                                                        >
                                                            <Upload className="h-4 w-4" />
                                                        </motion.div>
                                                        <div className="mt-3 text-sm text-black">
                                                            {fileName ? (
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <Check className="h-3.5 w-3.5" />
                                                                    <span className="max-w-[180px] truncate">
                                                                        {fileName}
                                                                    </span>
                                                                </span>
                                                            ) : (
                                                                "Drop sheet or click"
                                                            )}
                                                        </div>
                                                        <p className="mt-0.5 text-[11px] text-black/45">
                                                            .xlsx · .xls · .csv — reads the email column
                                                        </p>
                                                    </motion.label>
                                                ) : (
                                                    <motion.div
                                                        key="manual"
                                                        initial={{ opacity: 0, y: 4 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="flex gap-1.5"
                                                    >
                                                        <input
                                                            type="email"
                                                            value={manualEmail}
                                                            onChange={(e) => {
                                                                setManualEmail(e.target.value);
                                                                if (error) setError(null);
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    addManual();
                                                                }
                                                            }}
                                                            placeholder="name@example.com"
                                                            className="h-10 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black"
                                                        />
                                                        <button
                                                            onClick={addManual}
                                                            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-black text-white transition hover:bg-black/85"
                                                            aria-label="Add"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <AnimatePresence>
                                                {error && (
                                                    <motion.p
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-2 text-xs text-red-600"
                                                    >
                                                        {error}
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="mt-4 px-5">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-black/55">Pending</span>
                                                <motion.span
                                                    key={members.length}
                                                    initial={{ scale: 0.7, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1.5 text-[10px] leading-none text-white"
                                                >
                                                    {members.length}
                                                </motion.span>
                                            </div>
                                            {members.length > 0 && (
                                                <button
                                                    onClick={() => setMembers([])}
                                                    className="text-[11px] text-black/40 transition hover:text-black"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative h-36 overflow-hidden rounded-xl border border-black/[0.08] bg-gradient-to-b from-black/[0.02] to-transparent">
                                            {members.length === 0 ? (
                                                <div className="flex h-full flex-col items-center justify-center gap-1 text-black/30">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="text-xs">No one added yet</span>
                                                </div>
                                            ) : (
                                                <ul className="h-full space-y-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
                                                    <AnimatePresence initial={false}>
                                                        {members.map((m) => (
                                                            <motion.li
                                                                key={m.id}
                                                                layout
                                                                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{
                                                                    opacity: 0,
                                                                    x: 20,
                                                                    scale: 0.95,
                                                                    transition: { duration: 0.15 },
                                                                }}
                                                                transition={{
                                                                    type: "spring",
                                                                    stiffness: 400,
                                                                    damping: 30,
                                                                }}
                                                                className="group flex items-center justify-between gap-2 rounded-lg border border-transparent bg-white/60 px-2 py-1.5 transition hover:border-black/[0.08] hover:bg-white hover:shadow-sm"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-2">
                                                                    <div className="relative flex-none">
                                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neutral-700 to-black text-[11px] text-white shadow-sm ring-1 ring-black/10">
                                                                            {m.email[0]?.toUpperCase()}
                                                                        </div>
                                                                        <span
                                                                            title={
                                                                                m.source === "excel"
                                                                                    ? "From sheet"
                                                                                    : "Added manually"
                                                                            }
                                                                            className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-black ring-1 ring-black/10"
                                                                        >
                                                                            {m.source === "excel" ? (
                                                                                <FileSpreadsheet className="h-2 w-2" />
                                                                            ) : (
                                                                                <Mail className="h-2 w-2" />
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                    <span className="truncate text-xs text-black">
                                                                        {m.email}
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeMember(m.id)}
                                                                    className="flex h-6 w-6 flex-none items-center justify-center rounded-md text-black/30 opacity-0 transition group-hover:opacity-100 hover:bg-black/5 hover:text-black"
                                                                    aria-label={`Remove ${m.email}`}
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </motion.li>
                                                        ))}
                                                    </AnimatePresence>
                                                </ul>
                                            )}
                                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-black/5 bg-black/[0.02] px-5 py-3">
                                        <button
                                            onClick={handleClose}
                                            className="w-full py-2 bg-[#eceef1] text-black rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all duration-150"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleAddAll}
                                            disabled={members.length === 0}
                                            className="w-full py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all duration-150"
                                        >
                                            Add{members.length > 0 ? ` ${members.length}` : ""}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
