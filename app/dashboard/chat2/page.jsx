import { Mail } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-10 text-center animate-fade-in">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#f2f6fa]">
        <Mail className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-extrabold">Select a message</h2>
      <p className="mt-2 max-w-sm text-[#62748e]">
        Choose from your existing conversations, start a new one, or just keep
        swimming.
      </p>
      <button className="mt-6 rounded-full bg-[#1d9bf0] px-6 py-3 font-bold text-white shadow hover:bg-[#1a8cd8]">
        New message
      </button>
    </div>
  );
}
