"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Icon } from "@iconify/react";
import { DashboardEventsShell } from "@/components/DashboardEventsShell";
import EditProfile from "@/components/EditUserProfile/EditProfile";
import "@/app/dashboard/dashboard.css";
import "./UserProfileEdit.css"

export default function UserProfileEditPage() {
  const router = useRouter();

  return (
    <>

      <DashboardEventsShell>
        <header
          className="sticky top-0 z-50 flex h-[54px] w-full items-center justify-between border-b border-black/[0.06] bg-white/80 px-4 backdrop-blur-xl"
          style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          {/* Left */}
          <div
            className="flex items-center"
            style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <button
              onClick={() => router.back()}
              className="mr-6 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>

            <div>
              <h1 className="truncate text-[20px] font-bold leading-5 text-black">
                Edit Profile
              </h1>

              <p className="mt-0.5 text-[13px] leading-4 text-[#536471]">
                Update your profile
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">

            <div className="group relative">
              <button
                onClick={() => router.push(`/dashboard/chat2/${profile._id}`)}
                className="flex h-9 gap-1 px-4 items-center cursor-pointer justify-center rounded-full transition hover:bg-black/5"
              >
                <Icon
                  icon="solar:pen-outline"
                  className="text-[21px] text-[#171717]"
                />Save
              </button>

              <div className="pointer-events-none absolute right-1/2 top-full mt-2 translate-x-1/2 rounded-full bg-[#2c2f35] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-all duration-200 group-hover:translate-y-1 group-hover:opacity-100">
                Save Profile
              </div>
            </div>



          </div>
        </header>
        <div className="px-[10px]">
          <EditProfile onClose={() => router.push("/dashboard/Userprofile")} />
        </div>
      </DashboardEventsShell>
    </>
  );
}