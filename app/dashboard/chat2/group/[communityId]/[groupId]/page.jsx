"use client";

import { useParams } from "next/navigation";
import ChatConversation from "@/components/chat/ChatConversation";

export default function GroupChatPage() {
    const { communityId, groupId } = useParams();
    return <ChatConversation communityId={communityId} groupId={groupId} />;
}
