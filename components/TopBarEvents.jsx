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
      className="sticky top-0 z-50 mb-5 flex h-[54px] w-full items-start px-4 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl"
    >
      <div className="flex h-full items-center">
        <button
          onClick={handleBack}
          className="mr-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-black/5"
          aria-label={heading ? `Go back to ${heading}` : "Go back"}
        >
          <ArrowLeft size={20} strokeWidth={2.2} />
        </button>

        <h1 className="m-0 whitespace-nowrap text-[20px] font-bold leading-[54px] text-black">
          {heading}
        </h1>
      </div>
    </header>
  );
}