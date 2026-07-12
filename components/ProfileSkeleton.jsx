import { Award, BookOpen, GraduationCap, Layers } from "lucide-react";

function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={
        "relative isolate animate-pulse overflow-hidden rounded-md bg-[#e9ebef] before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-[#0a0a0a]/5 before:to-transparent " +
        className
      }
      {...props}
    />
  );
}

function SectionCardSkeleton({ title, icon: IconComponent, children }) {
  return (
    <section className="rounded-2xl border border-[#0000001A] bg-[#ffffff] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#e9ebef]">
          <IconComponent className="size-4 text-[#0a0a0a]" />
        </div>
        <h3 className="text-sm font-medium text-[#0a0a0a]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#0000001A] bg-[#ffffff] p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-4 aspect-video w-full rounded-xl" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[#0000001A] bg-[#ffffff]/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-full sm:w-28" />
          <Skeleton className="h-9 w-9 rounded-full sm:w-28" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-[14px] py-5 sm:gap-6">
        {/* Hero card */}
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#0000001A] bg-[#ffffff] p-6 text-center shadow-sm sm:flex-row sm:items-start sm:text-left">
          <Skeleton className="size-24 shrink-0 rounded-full ring-2 ring-[#e9ebef]" />
          <div className="flex w-full flex-1 flex-col items-center gap-2 sm:items-start">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="size-9 rounded-full" />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <SectionCardSkeleton title="Academic Information" icon={GraduationCap}>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#0000001A] bg-[#ffffff] p-3"
              >
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="mt-2 h-5 w-28" />
              </div>
            ))}
          </div>
        </SectionCardSkeleton>

        {/* Skills */}
        <SectionCardSkeleton title="Skills" icon={Layers}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2.5 rounded-xl border border-[#0000001A] bg-[#ffffff] p-4"
              >
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </SectionCardSkeleton>

        {/* Clubs */}
        <SectionCardSkeleton title="Clubs" icon={BookOpen}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-[#0000001A] bg-[#ffffff] p-3"
              >
                <Skeleton className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
                <Skeleton className="h-8 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCardSkeleton>

        {/* Achievements */}
        <SectionCardSkeleton title="Achievements" icon={Award}>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-[#0000001A] bg-[#ffffff] p-3 sm:items-center sm:gap-4 sm:p-4"
              >
                <Skeleton className="size-10 shrink-0 rounded-xl sm:size-11" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-full" />
                </div>
                <Skeleton className="hidden h-4 w-16 shrink-0 sm:block" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-3 h-10 w-full rounded-xl" />
        </SectionCardSkeleton>

        {/* Recent Posts */}
        <div className="mt-6">
          <Skeleton className="mb-3 h-6 w-32" />
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
