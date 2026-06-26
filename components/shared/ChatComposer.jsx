"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Film, Image as ImageIcon, Paperclip, Smile, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import ChatGiphyPicker from "@/components/shared/ChatGiphyPicker";

function formatBytes(size = 0) {
  if (!size) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** index;
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function ChatComposer({
  disabled = false,
  placeholder = "Type your message",
  disabledPlaceholder = "Select a chat to send messages",
  onSend,
  onError,
  initialText = "",
  initialMedia = [],
  draftKey = "",
}) {
  const [messageText, setMessageText] = useState("");
  const [showAttachmentFab, setShowAttachmentFab] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [pendingDocument, setPendingDocument] = useState(null);
  const [pendingMedia, setPendingMedia] = useState([]);
  const documentInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const isBusy = uploadingDocument || uploadingMedia;
  const isDisabled = disabled || isBusy;

  useEffect(() => {
    if (!draftKey) return;
    setMessageText(initialText || "");
    setPendingMedia(Array.isArray(initialMedia) ? initialMedia.filter((media) => media?.url) : []);
    setPendingDocument(null);
    closePickers();
  }, [draftKey, initialText, initialMedia]);

  function closePickers() {
    setShowAttachmentFab(false);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
  }

  async function sendPayload(payload) {
    if (typeof onSend !== "function") return;
    await onSend(payload);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedText = messageText.trim();
    if (isDisabled || (!trimmedText && !pendingDocument && !pendingMedia.length)) return;

    try {
      if (pendingMedia.length) {
        await sendPayload({ text: trimmedText, messageType: "media", attachments: pendingMedia });
        setPendingMedia([]);
      } else {
        if (pendingDocument) {
          await sendPayload({
            text: pendingDocument.fileName || "Document",
            messageType: "document",
            attachment: pendingDocument,
          });
          setPendingDocument(null);
        }
        if (trimmedText) {
          await sendPayload({ text: trimmedText, messageType: "text" });
        }
      }
      setMessageText("");
      closePickers();
    } catch (err) {
      onError?.(err.message || "Failed to send message");
    }
  }

  function handleEmojiSelect(emojiData) {
    if (!emojiData?.emoji) return;
    setMessageText((prev) => `${prev}${emojiData.emoji}`);
    setShowEmojiPicker(false);
  }

  async function handleGifSelect(mediaUrl) {
    if (!mediaUrl || isDisabled) return;
    try {
      await sendPayload({ text: mediaUrl, messageType: "gif" });
      closePickers();
    } catch (err) {
      onError?.(err.message || "Failed to send GIF");
    }
  }

  async function uploadSelectedFiles(selectedFiles) {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    const response = await fetch("/api/chat/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to upload files");
    return data.files || [];
  }

  async function handleDocumentUpload(event) {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";
    if (!selectedFile) return;
    if (disabled) {
      onError?.(disabledPlaceholder);
      return;
    }
    try {
      setUploadingDocument(true);
      onError?.("");
      const uploaded = await uploadSelectedFiles([selectedFile]);
      setPendingDocument(uploaded[0] || null);
      setPendingMedia([]);
      closePickers();
    } catch (err) {
      onError?.(err.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  }

  async function handleMediaUpload(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selectedFiles.length) return;
    if (disabled) {
      onError?.(disabledPlaceholder);
      return;
    }
    try {
      setUploadingMedia(true);
      onError?.("");
      const uploadedMedia = await uploadSelectedFiles(selectedFiles);
      setPendingMedia(uploadedMedia);
      setPendingDocument(null);
      closePickers();
    } catch (err) {
      onError?.(err.message || "Failed to upload media");
    } finally {
      setUploadingMedia(false);
    }
  }

  return (
    <form className="chat-compose" onSubmit={handleSubmit}>
      <div className="chat-attachment-wrap">
        <button
          className="chatmediabtn"
          type="button"
          onClick={() => setShowAttachmentFab((prev) => !prev)}
          disabled={disabled || isBusy}
          aria-label="Open message attachments"
        >
          {showAttachmentFab ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
        </button>

        {showAttachmentFab && (
          <div className="chat-fab-menu">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker((prev) => !prev);
                setShowGifPicker(false);
              }}
            >
              <Smile size={16} /> Emoji
            </button>
            <button
              type="button"
              onClick={() => {
                setShowGifPicker((prev) => !prev);
                setShowEmojiPicker(false);
              }}
            >
              <ImageIcon size={16} /> GIF
            </button>
            <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia}>
              <Film size={16} /> {uploadingMedia ? "Uploading..." : "Photos & Videos"}
            </button>
            <button type="button" onClick={() => documentInputRef.current?.click()} disabled={uploadingDocument}>
              <FileText size={16} /> {uploadingDocument ? "Uploading..." : "Document"}
            </button>
          </div>
        )}

        {showEmojiPicker && (
          <div className="chat-picker">
            <EmojiPicker onEmojiClick={handleEmojiSelect} width={320} height={360} lazyLoadEmojis />
          </div>
        )}

        {showGifPicker && (
          <div className="chat-picker chat-gif-picker">
            <ChatGiphyPicker onSelect={handleGifSelect} />
          </div>
        )}

        <input
          ref={documentInputRef}
          type="file"
          className="chat-hidden-input"
          onChange={handleDocumentUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        />
        <input
          ref={mediaInputRef}
          type="file"
          className="chat-hidden-input"
          onChange={handleMediaUpload}
          accept="image/*,video/mp4,video/webm,video/quicktime"
          multiple
        />
      </div>

      <div className="chat-compose-inputs">
        {pendingDocument && (
          <div className="chat-pending-document">
            <div>
              <strong>{pendingDocument.fileName || "Document"}</strong>
              <small>{pendingDocument.mimeType || "Attachment"} • {formatBytes(pendingDocument.size)}</small>
            </div>
            <button type="button" onClick={() => setPendingDocument(null)} aria-label="Remove selected document">
              <X size={14} />
            </button>
          </div>
        )}

        {!!pendingMedia.length && (
          <div className="chat-pending-media-row">
            {pendingMedia.map((media, index) => {
              const isVideo = media.mimeType?.startsWith("video/");
              return (
                <div className="chat-pending-media-card" key={`pending-media-${media.url || index}`}>
                  {isVideo ? (
                    <video src={media.url} className="chat-pending-media-preview" muted playsInline />
                  ) : (
                    <img
                      src={media.url}
                      className="chat-pending-media-preview"
                      alt={media.fileName || `selected media ${index + 1}`}
                    />
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setPendingMedia([])} className="chat-pending-media-remove">
              <X size={14} />
            </button>
          </div>
        )}

        <input
          className="chatcomposeinput"
          type="text"
          placeholder={disabled ? disabledPlaceholder : pendingMedia.length ? "Add a caption (optional)" : placeholder}
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          disabled={disabled}
        />
      </div>
      <button
        className="chatsendbtn"
        type="submit"
        disabled={isDisabled || (!messageText.trim() && !pendingDocument && !pendingMedia.length)}
      >
        Send
      </button>
    </form>
  );
}
