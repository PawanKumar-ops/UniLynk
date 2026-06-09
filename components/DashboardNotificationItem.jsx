import { Bell } from "lucide-react";
import ImageWithFallback from "./ReliableImage";

export function DashboardNotificationItem({
  title,
  subtitle,
  imageSrc,
  imageAlt = "Notification",
  Icon = Bell,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`flex w-full h-[60px] items-center gap-3 p-3 rounded-2xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition bg-white ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-100 shrink-0 flex items-center justify-center">
        {imageSrc ? (
          <ImageWithFallback
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="h-5 w-5 text-neutral-700" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate text-black">{title}</div>
        {subtitle && (
          <div className="text-xs text-neutral-500 truncate">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
