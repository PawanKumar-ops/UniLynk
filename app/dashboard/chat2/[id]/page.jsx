"use client";

import { useParams } from "next/navigation";
import ChatConversation from "@/components/chat/ChatConversation";

export default function DirectMessagePage() {
    const { id } = useParams();
    return <ChatConversation id={id} />;
}
