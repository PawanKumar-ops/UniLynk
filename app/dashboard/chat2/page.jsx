"use client"

import { Icon } from "@iconify/react";
import { NewMessageModal } from "@/components/chat/chat-ui";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmptyState() {
  const [newMsg, setNewMsg] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f6fa]">
        <Icon icon="solar:chat-line-line-duotone" className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-extrabold">Select a message</h2>
      <p className="mt-2 max-w-sm text-[#62748e]">
        Start a new conversation or select an existing chat to continue messaging.
      </p>
      <button 
      onClick={() => setNewMsg(true)}
      className="mt-6 rounded-full bg-[#1d9bf0] px-6 py-3 font-bold text-white shadow hover:bg-[#1a8cd8]">
        New message
      </button>
      <NewMessageModal
                      open={newMsg}
                      onClose={() => setNewMsg(false)}
                      onPick={(u) => router.push(`/dashboard/chat2/${u.id}`)}
                  />
    </div>
  );
}
