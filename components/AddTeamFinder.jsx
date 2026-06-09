import { Loader2, Users } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

const TEAM_FINDER_COPY = {
    solo: {
        title: "Add to Team Finder?",
        description: "Your profile will be visible to others looking for teammates.",
        confirmLabel: "Add",
    },
    team: {
        title: "Add team to Team Finder?",
        description: "Your team will be visible to solo participants looking for a team.",
        confirmLabel: "Add",
    },
};

export function AddTeamFinder({ open, onOpenChange, type = "solo", onConfirm, loading = false }) {
    const copy = TEAM_FINDER_COPY[type] || TEAM_FINDER_COPY.solo;

    return (
        <Dialog.Root open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] rounded-3xl border border-black/5 bg-white p-5 shadow-2xl focus:outline-none z-50 transition-opacity transition-transform duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=closed]:scale-95">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                            <Users className="h-4 w-4 text-black" strokeWidth={2} />
                        </div>

                        <Dialog.Title className="mt-3 text-black font-semibold text-base">
                            {copy.title}
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-neutral-500 text-sm">
                            {copy.description}
                        </Dialog.Description>
                    </div>

                    <div className="mt-5 flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Adding...
                                </span>
                            ) : (
                                copy.confirmLabel
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                            className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm text-black transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            Cancel
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
