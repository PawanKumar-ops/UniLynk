import { AlertTriangle } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

export function DeleteModal({ open, onOpenChange }) {
    const handle = () => {
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] rounded-3xl border border-black/5 bg-white p-5 shadow-2xl focus:outline-none z-50 transition-opacity transition-transform duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:scale-100 data-[state=closed]:scale-95">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                            <AlertTriangle className="h-4 w-4 text-black" strokeWidth={2} />
                        </div>

                        <Dialog.Title className="mt-3 text-black font-semibold text-base">
                            Delete post?
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-neutral-500 text-sm">
                            Are you sure you want to delete this post? This action is permanent and cannot be undone.
                        </Dialog.Description>
                    </div>

                    <div className="mt-5 flex flex-col gap-1.5">
                        <button
                            type="button"
                            onClick={() => handle("me")}
                            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-black transition-colors hover:bg-neutral-50"
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="w-full rounded-full bg-neutral-100 px-4 py-2 text-sm text-black transition-colors hover:bg-neutral-200"
                        >
                            Cancel
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
