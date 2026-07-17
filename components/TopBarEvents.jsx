"use client";

import { useRouter } from "next/navigation";
import { Search, ArrowLeft } from "lucide-react";

export function TopBar({ showBack = false }) {
    const router = useRouter();

    return (
        <header
            className="sticky top-0 z-50 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
            {/* Left */}
            <div
                className="flex items-center"
                style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            >{showBack ?
                <button
                    onClick={() => router.push('/dashboard/events')}
                    className="mr-6 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                >
                    <ArrowLeft size={20} strokeWidth={2.2} />
                </button>
                : <button
                    onClick={() => router.back()}
                    className="mr-6 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                >
                    <ArrowLeft size={20} strokeWidth={2.2} />
                </button>}


                <div>
                    <h1 className="truncate text-[20px] font-bold leading-5 text-black">
                        {showBack ? "Forms" : "Events"}
                    </h1>
                </div>
            </div>

        </header>
    );
}