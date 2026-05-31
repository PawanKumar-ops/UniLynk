import { useState, useEffect, useId } from "react";
import { MapPin, Users, X, Plus, ArrowRight } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function PastEventNotifiModal({ isOpen, onClose, event, onSuccess }) {
  const [images, setImages] = useState([null, null, null, null]);
  const [location, setLocation] = useState("");
  const [participants, setParticipants] = useState("");
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const eventName = event?.title || "Event Name";
  const maxDescriptionLength = 60;

  // Reset states when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setImages([null, null, null, null]);
      setLocation("");
      setParticipants("");
      setDescription("");
      setIsPublishing(false);
    }
  }, [isOpen, event]);

  const handleImageUpload = (index, ev) => {
    const file = ev.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => {
          const next = [...prev];
          next[index] = reader.result;
          return next;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const filledImages = images.filter((i) => i !== null).length;
  const allImagesUploaded = filledImages === 4;
  const canSubmit = allImagesUploaded && location && participants && description && !isPublishing;

  const fieldsComplete = [
    allImagesUploaded,
    Boolean(location),
    Boolean(participants),
    Boolean(description),
  ];
  const completedCount = fieldsComplete.filter(Boolean).length;

  const handlePublish = async () => {
    if (!canSubmit || isPublishing || !event) return;
    setIsPublishing(true);

    try {
      const uploadedUrls = [];
      // Upload images one-by-one to avoid Vercel Hobby plan timeout (10s limit) and request size limits
      for (let i = 0; i < images.length; i++) {
        const dataUrl = images[i];
        if (!dataUrl) continue;

        // Convert base64 data URL to Blob and then a File
        const blob = await fetch(dataUrl).then((res) => res.blob());
        const file = new File([blob], `activity_img_${i}.jpg`, { type: blob.type });

        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/posts/upload-image", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Failed to upload image ${i + 1}: ${errText}`);
        }

        const uploadData = await uploadRes.json();
        if (!uploadData.url) {
          throw new Error(`Failed to upload image ${i + 1}: URL not returned`);
        }

        uploadedUrls.push(uploadData.url);
      }

      // Submit completed activity details to the club activities route
      const submitRes = await fetch(`/api/clubs/${event.clubId}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formId: event._id,
          title: eventName,
          description,
          date: event.date,
          location,
          participants: Number(participants),
          images: uploadedUrls,
        }),
      });

      if (!submitRes.ok) {
        const submitData = await submitRes.json();
        throw new Error(submitData.message || "Failed to publish activity.");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("PUBLISH ACTIVITY ERROR:", error);
      alert(error.message || "Something went wrong while publishing.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open && !isPublishing) onClose(); }}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-50 bg-black/40"
                style={{ backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-[440px]"
              >
                <div className="relative bg-white rounded-[20px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden">
                  {/* Close — floating */}
                  <Dialog.Close asChild disabled={isPublishing}>
                    <button
                      className="absolute top-4 right-4 z-10 w-7 h-7 inline-flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </Dialog.Close>

                  {/* Header — editorial */}
                  <div className="px-6 pt-6 pb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1 h-1 rounded-full bg-black" />
                      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-medium">
                        New Event
                      </span>
                    </div>
                    <Dialog.Title asChild>
                      <h2 className="text-[28px] leading-[1.05] tracking-[-0.01em] text-black" style={{ fontFamily: "var(--font-serif)" }}>
                        {eventName}
                      </h2>
                    </Dialog.Title>
                  </div>

                  <div className="h-px bg-neutral-100" />

                  {/* Photos */}
                  <div className="px-6 pt-5 pb-4">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 font-medium">
                        Photographs
                      </span>
                      <span className="text-[11px] text-neutral-400 tabular-nums">
                        {filledImages} / 4
                      </span>
                    </div>

                    {/* 4 equal 16:9 slots */}
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((image, i) => (
                        <ImageSlot
                          key={i}
                          image={image}
                          onUpload={(e) => handleImageUpload(i, e)}
                          onRemove={() => removeImage(i)}
                          disabled={isPublishing}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="px-6 pb-5 space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <Field
                        icon={<MapPin className="w-3 h-3" strokeWidth={2} />}
                        label="Location"
                      >
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="San Francisco"
                          disabled={isPublishing}
                          className="w-full bg-transparent text-sm text-black placeholder:text-neutral-300 focus:outline-none py-1 disabled:opacity-50"
                        />
                      </Field>

                      <Field
                        icon={<Users className="w-3 h-3" strokeWidth={2} />}
                        label="Attendees"
                      >
                        <input
                          type="number"
                          value={participants}
                          onChange={(e) => setParticipants(e.target.value)}
                          placeholder="240"
                          min="1"
                          disabled={isPublishing}
                          className="w-full bg-transparent text-sm text-black placeholder:text-neutral-300 focus:outline-none py-1 tabular-nums disabled:opacity-50"
                        />
                      </Field>
                    </div>

                    <Field
                      label="Description"
                      trailing={
                        <span className="text-[10px] text-neutral-400 tabular-nums">
                          {description.length}/{maxDescriptionLength}
                        </span>
                      }
                    >
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => {
                          if (e.target.value.length <= maxDescriptionLength) {
                            setDescription(e.target.value);
                          }
                        }}
                        placeholder="A gathering of builders and dreamers."
                        disabled={isPublishing}
                        className="w-full bg-transparent text-sm text-black placeholder:text-neutral-300 focus:outline-none py-1 disabled:opacity-50"
                      />
                    </Field>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between">
                    {/* Progress dots */}
                    <div className="flex items-center gap-1.5">
                      {fieldsComplete.map((done, i) => (
                        <motion.span
                          key={i}
                          animate={{
                            backgroundColor: done ? "#000000" : "#e5e5e5",
                            scale: done ? 1 : 0.85,
                          }}
                          transition={{ duration: 0.2 }}
                          className="w-1.5 h-1.5 rounded-full"
                        />
                      ))}
                      <span className="ml-2 text-[11px] text-neutral-400 tabular-nums">
                        {completedCount}/4
                      </span>
                    </div>

                    <button
                      onClick={handlePublish}
                      disabled={!canSubmit || isPublishing}
                      className="group inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-all disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed"
                    >
                      {isPublishing ? "Publishing..." : "Publish"}
                      {!isPublishing && (
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-enabled:group-hover:translate-x-0.5" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ImageSlot({ image, onUpload, onRemove, disabled }) {
  const reactId = useId();
  const id = `img-${reactId.replace(/:/g, "")}`;

  return (
    <div className="relative group aspect-[16/9]">
      <input type="file" accept="image/*" onChange={onUpload} className="hidden" id={id} disabled={disabled} />
      <label
        htmlFor={id}
        className={`block w-full h-full rounded-[8px] overflow-hidden transition-all ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        } ${
          image
            ? "ring-1 ring-black/[0.06]"
            : "bg-neutral-50 hover:bg-neutral-100 ring-1 ring-dashed ring-neutral-200 hover:ring-neutral-300"
        }`}
      >
        {image ? (
          <div className="absolute inset-0">
            <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover block" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onRemove();
                }}
                className="absolute top-1.5 right-1.5 w-5 h-5 inline-flex items-center justify-center rounded-full bg-white/95 text-black shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                aria-label="Remove"
              >
                <X className="w-2.5 h-2.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
        )}
      </label>
    </div>
  );
}

function Field({ icon, label, trailing, children }) {
  return (
    <div className="group rounded-[10px] bg-neutral-50 px-3 py-2 transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-black/15">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1.5 text-neutral-500">
          {icon}
          <span className="text-[10px] uppercase tracking-[0.12em] font-medium">{label}</span>
        </div>
        {trailing}
      </div>
      {children}
    </div>
  );
}
