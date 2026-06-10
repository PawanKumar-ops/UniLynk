import { useState, useRef, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImagePlus, Newspaper, Loader2, Minus, Plus, ArrowLeft, CropIcon } from "lucide-react";
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const MAX_DESC = 120;
const CARD_WIDTH = 325;
const CARD_HEIGHT = 475;
const CARD_ASPECT = CARD_WIDTH / CARD_HEIGHT;
const CROP_OUTPUT_TYPE = "image/jpeg";
const CROP_OUTPUT_QUALITY = 0.86;

function revokeObjectUrl(url) {
  if (url) URL.revokeObjectURL(url);
}

function centerAspectCrop(mediaW, mediaH, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaW, mediaH),
    mediaW,
    mediaH,
  );
}

export function PublishNewsLetter({ clubId = "", onPublished } = {}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [applyingCrop, setApplyingCrop] = useState(false);

  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const fileRef = useRef(null);
  const pendingFileRef = useRef(null);
  const cropObjectUrlRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  const [form, setForm] = useState({
    price: 0,
    description: "",
    coverImage: null,
    coverPreview: null,
    croppedBlob: null,
    error: "",
  });

  useEffect(() => {
    return () => {
      revokeObjectUrl(cropObjectUrlRef.current);
      revokeObjectUrl(previewObjectUrlRef.current);
    };
  }, []);

  const clearCropSource = useCallback(() => {
    revokeObjectUrl(cropObjectUrlRef.current);
    cropObjectUrlRef.current = null;
    setCropSrc(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setApplyingCrop(false);
  }, []);

  const handleFile = (file) => {
    if (!file?.type?.startsWith("image/")) {
      setForm((f) => ({ ...f, error: "Please choose a valid image file." }));
      return;
    }

    const url = URL.createObjectURL(file);
    revokeObjectUrl(cropObjectUrlRef.current);
    cropObjectUrlRef.current = url;
    pendingFileRef.current = file;

    setCrop(undefined);
    setCompletedCrop(null);
    setApplyingCrop(false);
    setCropSrc(url);
    setForm((f) => ({ ...f, error: "" }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onImageLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    const nextCrop = centerAspectCrop(w, h, CARD_ASPECT);

    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, w, h));
  }, []);

  const applyCrop = () => {
    if (!completedCrop || !imgRef.current || applyingCrop) return;

    setApplyingCrop(true);

    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setApplyingCrop(false);
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      CROP_OUTPUT_WIDTH,
      CROP_OUTPUT_HEIGHT,
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setApplyingCrop(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        revokeObjectUrl(previewObjectUrlRef.current);
        previewObjectUrlRef.current = url;

        setForm((f) => ({
          ...f,
          coverImage: pendingFileRef.current || f.coverImage,
          coverPreview: url,
          croppedBlob: blob,
          error: "",
        }));
        pendingFileRef.current = null;
        clearCropSource();
      },
      CROP_OUTPUT_TYPE,
      CROP_OUTPUT_QUALITY,
    );
  };

  const cancelCrop = () => {
    pendingFileRef.current = null;
    clearCropSource();
  };

  const adjustPrice = (delta) => {
    setForm((f) => ({ ...f, price: Math.max(0, f.price + delta) }));
  };

  const resetForm = () => {
    pendingFileRef.current = null;
    clearCropSource();
    revokeObjectUrl(previewObjectUrlRef.current);
    previewObjectUrlRef.current = null;
    setForm({
      price: 0,
      description: "",
      coverImage: null,
      coverPreview: null,
      croppedBlob: null,
      error: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const coverImageToUpload = form.croppedBlob || form.coverImage;

    if (!clubId) {
      setForm((f) => ({ ...f, error: "Club details are still loading. Please try again." }));
      return;
    }

    if (!form.description.trim()) {
      setForm((f) => ({ ...f, error: "Please add a short description before publishing." }));
      return;
    }

    if (!coverImageToUpload) {
      setForm((f) => ({ ...f, error: "Please apply the cover crop before publishing." }));
      return;
    }

    setSubmitting(true);
    setForm((f) => ({ ...f, error: "" }));

    try {
      const body = new FormData();
      body.append("clubId", clubId);
      body.append("price", String(form.price));
      body.append("description", form.description.trim());
      body.append("coverImage", coverImageToUpload, "newsletter-cover.jpg");

      const response = await fetch("/api/newsletter", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Failed to publish newsletter");
      }

      setSubmitted(true);
      onPublished?.(data?.newsletter);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        resetForm();
      }, 1600);
    } catch (error) {
      setForm((f) => ({ ...f, error: error.message || "Failed to publish newsletter" }));
    } finally {
      setSubmitting(false);
    }
  };

  const isCropping = !!cropSrc;
  const hasAppliedCover = Boolean(form.croppedBlob || form.coverImage || form.coverPreview);
  const isValid = Boolean(form.description.trim() && hasAppliedCover && !isCropping);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) { cancelCrop(); setSubmitted(false); setSubmitting(false); }
        setOpen(v);
      }}
    >
      {/* Fixed compose button */}
      <Dialog.Trigger asChild>
        <button
          aria-label="Post newsletter"
          className="fixed bottom-7 right-7 z-50 flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.26)] transition-all duration-200 hover:bg-[#1c1c1c] hover:shadow-[0_10px_36px_rgba(0,0,0,0.32)] active:scale-95"
        >
          <Newspaper className="h-4 w-4 text-white shrink-0" strokeWidth={1.8} />
          <span className="text-white leading-none" style={{ fontSize: "13.5px", fontWeight: 500 }}>
            Post Newsletter
          </span>
        </button>
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`fixed inset-0 z-50 ${isCropping ? "overflow-hidden bg-black/25" : "bg-black/25 backdrop-blur-[2px]"}`}
              >
                {isCropping ? <div className="absolute inset-0 bg-white/55" /> : null}
              </motion.div>
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 outline-none ${isCropping ? "max-w-[512px]" : "max-w-[410px]"}`}
              >
                <div className="rounded-2xl bg-white border border-black/[0.07] shadow-[0_20px_60px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-4">
                    <div className="flex items-center gap-2">
                      {isCropping && (
                        <button
                          type="button"
                          onClick={cancelCrop}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[#aaa] transition-all duration-150 hover:bg-[#f3f3f3] hover:text-[#0a0a0a] active:scale-90"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </button>
                      )}
                      <Dialog.Title
                        className="text-[#0a0a0a] m-0 p-0 leading-none"
                        style={{ fontSize: "15px", fontWeight: 600 }}
                      >
                        {isCropping ? "Crop Cover" : "Post Newsletter"}
                      </Dialog.Title>
                    </div>
                    <Dialog.Close asChild>
                      <button
                        aria-label="Close"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[#aaa] transition-all duration-150 hover:bg-[#f3f3f3] hover:text-[#0a0a0a] active:scale-90"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </button>
                    </Dialog.Close>
                  </div>

                  <div className="h-px mx-5 bg-[#f0f0f0]" />

                  <AnimatePresence mode="wait">

                    {/* ── CROPPER VIEW ── */}
                    {isCropping ? (
                      <motion.div
                        key="cropper"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col gap-4 px-5 pt-4 pb-5"
                      >
                        <div className="flex items-center gap-1.5 text-[#999]">
                          <CropIcon className="h-3 w-3" strokeWidth={2} />
                          <span style={{ fontSize: "11.5px" }}>Drag to adjust — locked to 325 : 475</span>
                        </div>

                        <div className="flex items-center justify-center rounded-xl overflow-hidden bg-[#f5f5f5] border border-[#ebebeb]">
                          <ReactCrop
                            crop={crop}
                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                            onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                            aspect={CARD_ASPECT}
                            minWidth={40}
                            className="w-full bg-[#858583] [&_.ReactCrop__child-wrapper]:w-full"
                          >
                            <img
                              ref={imgRef}
                              src={cropSrc}
                              alt="Crop source"
                              onLoad={onImageLoad}
                              className="w-full select-none"
                              decoding="sync"
                              style={{ maxHeight: "60vh", display: "block" }}
                            />
                          </ReactCrop>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={cancelCrop}
                            className="h-8 rounded-lg border border-[#ebebeb] px-4 text-[#777] transition-all duration-150 hover:border-[#d5d5d5] hover:text-[#0a0a0a] active:scale-[0.97]"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={applyCrop}
                            disabled={!completedCrop || applyingCrop}
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0a0a0a] px-4 text-white transition-all duration-150 hover:bg-[#1c1c1c] active:scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            {applyingCrop ? "Applying…" : "Apply Crop"}
                          </button>
                        </div>
                      </motion.div>

                    ) : submitted ? (

                      /* ── SUCCESS VIEW ── */
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center justify-center px-5 py-12 gap-2.5"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a0a0a] mb-1">
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10.5L8.5 15L16 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-[#0a0a0a]" style={{ fontSize: "14px", fontWeight: 600 }}>Published!</p>
                        <p className="text-[#999]" style={{ fontSize: "12px" }}>Your newsletter is now live.</p>
                      </motion.div>

                    ) : (

                      /* ── FORM VIEW ── */
                      <motion.form
                        key="form"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        onSubmit={handleSubmit}
                        className="px-5 pt-4 pb-5 flex flex-col gap-4"
                      >
                        <div className="flex gap-3.5">

                          {/* Cover image upload — 325:475 portrait */}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            className={`relative flex-none cursor-pointer rounded-xl border-[1.5px] border-dashed overflow-hidden transition-all duration-200 flex flex-col items-center justify-center
                              ${dragOver ? "border-[#0a0a0a] bg-[#f8f8f8]" : form.coverPreview ? "border-transparent" : "border-[#e0e0e0] bg-[#fafafa] hover:border-[#bbb] hover:bg-[#f7f7f7]"}`}
                            style={{ width: 126, height: 184, flexShrink: 0 }}
                          >
                            {form.coverPreview ? (
                              <>
                                <img
                                  src={form.coverPreview}
                                  alt="Cover"
                                  className="absolute inset-0 h-full w-full object-cover rounded-xl"
                                />
                                <div className="absolute inset-0 rounded-xl bg-black/45 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 gap-1.5" onClick={() => {
                                    if (form.coverImage) {
                                      const url = URL.createObjectURL(form.coverImage);
                                      setCropSrc(url);
                                      setCrop(null);
                                      setCompletedCrop(null);
                                    }
                                  }}>
                                  <CropIcon className="h-4 w-4 text-white" strokeWidth={1.8} />
                                  <span className="text-white leading-none" style={{ fontSize: "10px", fontWeight: 500 }}>Re-crop</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-2 pointer-events-none px-2 text-center">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ebebeb]">
                                  <ImagePlus className="h-3.5 w-3.5 text-[#888]" strokeWidth={1.8} />
                                </div>
                                <p className="text-[#aaa] leading-snug" style={{ fontSize: "10.5px" }}>
                                  Front page
                                  <br />
                                  <span className="text-[#ccc]" style={{ fontSize: "9.5px" }}>opens crop instantly</span>
                                </p>
                              </div>
                            )}
                          </div>
                          <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                          />

                          {/* Right column: price + description */}
                          <div className="flex flex-1 flex-col gap-3 min-w-0">

                            {form.error && (
                              <p className="rounded-lg bg-red-50 px-3 py-2 text-red-600" style={{ fontSize: "11px" }}>
                                {form.error}
                              </p>
                            )}

                            {/* Price stepper */}
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[#0a0a0a] m-0 p-0 leading-none" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                                Price
                              </label>
                              <div className="flex items-center h-9 rounded-xl border border-[#ebebeb] bg-white overflow-hidden divide-x divide-[#ebebeb]">
                                <button
                                  type="button"
                                  onClick={() => adjustPrice(-10)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="flex w-9 h-full items-center justify-center text-[#aaa] transition-colors duration-150 hover:bg-[#f8f8f8] hover:text-[#0a0a0a] active:bg-[#f3f3f3]"
                                >
                                  <Minus className="h-3 w-3" strokeWidth={2.5} />
                                </button>

                                <div className="flex flex-1 items-center justify-center gap-0.5 h-full px-1">
                                  <span className="text-[#bbb] leading-none" style={{ fontSize: "11px" }}>₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: Math.max(0, Number(e.target.value)) }))}
                                    className="w-full text-center text-[#0a0a0a] bg-transparent outline-none no-spinners"
                                    style={{ fontSize: "13px", fontWeight: 500 }}
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => adjustPrice(10)}
                                  onMouseDown={(e) => e.preventDefault()}
                                  className="flex w-9 h-full items-center justify-center text-[#aaa] transition-colors duration-150 hover:bg-[#f8f8f8] hover:text-[#0a0a0a] active:bg-[#f3f3f3]"
                                >
                                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                                </button>
                              </div>
                              <p className="text-[#ccc] leading-none" style={{ fontSize: "10px" }}>0 = free edition</p>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col gap-1.5 flex-1">
                              <div className="flex items-center justify-between">
                                <label htmlFor="nl-desc" className="text-[#0a0a0a] m-0 p-0 leading-none" style={{ fontSize: "11.5px", fontWeight: 500 }}>
                                  Description
                                </label>
                                <span
                                  className="leading-none transition-colors duration-150"
                                  style={{
                                    fontSize: "10px",
                                    color: form.description.length > MAX_DESC * 0.85 ? "#e05c5c" : "#ccc",
                                  }}
                                >
                                  {form.description.length}/{MAX_DESC}
                                </span>
                              </div>
                              <textarea
                                id="nl-desc"
                                maxLength={MAX_DESC}
                                placeholder="A short, punchy summary…"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                className="nl-scrollbar flex-1 w-full resize-none rounded-xl border border-[#ebebeb] bg-white px-3 py-2.5 text-[#0a0a0a] placeholder-[#d5d5d5] outline-none transition-all duration-150 focus:border-[#0a0a0a] focus:ring-2 focus:ring-black/[0.05]"
                                style={{ fontSize: "12px", lineHeight: "1.6", minHeight: 112 }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <Dialog.Close asChild>
                            <button
                              type="button"
                              className="h-8 rounded-lg border border-[#ebebeb] px-4 text-[#777] transition-all duration-150 hover:border-[#d5d5d5] hover:text-[#0a0a0a] active:scale-[0.97]"
                              style={{ fontSize: "12px", fontWeight: 500 }}
                            >
                              Cancel
                            </button>
                          </Dialog.Close>

                          <button
                            type="submit"
                            disabled={!isValid || submitting}
                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0a0a0a] px-4 text-white transition-all duration-150 hover:bg-[#1c1c1c] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
                            style={{ fontSize: "12px", fontWeight: 500 }}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />
                                <span>Publishing…</span>
                              </>
                            ) : (
                              <span>Publish Edition</span>
                            )}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
