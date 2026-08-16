"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function TopBar({
    showBack = false,
    title,
    backPath = null,
    onBack = null,
}) {
    const router = useRouter();
    const heading = title ?? (showBack ? "Forms" : "Events");

    const handleBack = () => {
        if (onBack) {
            onBack();
            return;
        }

        if (backPath) {
            router.push(backPath);
            return;
        }

        if (showBack) {
            router.push("/dashboard/events");
            return;
        }

        router.back();
    };

    return (
        <header
            className="sticky top-0 z-50 mb-5 flex h-[54px] items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
            <div
                className="flex items-center"
                style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
            >
                <button
                    onClick={handleBack}
                    className="mr-6 flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5"
                    aria-label={heading ? `Go back to ${heading}` : "Go back"}
                >
                    <ArrowLeft size={20} strokeWidth={2.2} />
                </button>

                <div>
                    <h1 className="truncate text-[20px] font-bold leading-5 text-black">
                        {heading}
                    </h1>
                </div>
            </div>
        </header>
    );
}