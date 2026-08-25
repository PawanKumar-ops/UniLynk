import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Icon } from "@iconify/react";

export default function Select({
  value,
  options = [],
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value);
  const IconName = current?.icon;

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 text-left text-sm transition ${open ? "border-ink ring-4 ring-ink/[0.06]" : "border-hair hover:border-neutral-300"
          }`}
      >
        {IconName && (
          <Icon
            icon={IconName}
            className="size-5 shrink-0 text-muted"
          />
        )}
        <span className="min-w-0 flex-1 truncate">{current?.label}</span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 max-h-64 w-full min-w-max overflow-auto rounded-xl border border-hair bg-white p-1.5 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.25)]">
          {options.map((o) => {
            const OIcon = o.icon;
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${on ? "bg-ink text-white" : "hover:bg-neutral-100"
                  }`}
              >
                {OIcon && (
                  <Icon
                    icon={OIcon}
                    className={`size-4 shrink-0 ${on ? "text-white" : "text-muted"}`}
                  />
                )}
                <span className="flex-1 whitespace-nowrap">{o.label}</span>
                {on && <Check className="size-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
