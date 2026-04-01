"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value?: string;                // stored path e.g. "/uploads/products/abc.jpg"
  onChange: (url: string) => void;
  label?: string;
  folder?: "products" | "logos" | "icons";  // upload subfolder
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("admin-auth") : null;
    return raw ? JSON.parse(raw)?.state?.token : null;
  } catch { return null; }
}

/** Resolve a stored path to a full displayable URL */
export function resolveStoredImage(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/")) return `${BASE}${url}`;
  if (url.startsWith("http")) return url;
  return null;
}

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  folder = "products",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const previewSrc = resolveStoredImage(value);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Client-side validation
    const MAX = 8 * 1024 * 1024;
    if (file.size > MAX) { setError("File too large (max 8 MB)"); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowed.includes(file.type)) { setError("Only JPG, PNG, WebP, GIF, AVIF allowed"); return; }

    setUploading(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = getToken();
      const res = await fetch(`${BASE}/api/upload/image?folder=${folder}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      // data.url is the final stored path: /uploads/products/filename.jpg
      onChange(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); onChange("");
  };

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      )}

      <div
        className={`relative rounded-xl border-2 border-dashed transition cursor-pointer select-none ${
          uploading ? "border-primary/50 bg-primary/5 cursor-wait"
          : dragOver  ? "border-primary bg-primary/5"
          : previewSrc ? "border-border"
          : "border-border hover:border-primary/50 hover:bg-muted/20"
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        {previewSrc ? (
          <div className="relative p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt="Preview"
              className="h-32 w-full object-contain rounded-lg bg-muted"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            {/* Stored path badge */}
            <div className="mt-1.5 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground font-mono truncate">{value}</span>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-background shadow border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition"
            >
              <X className="w-3 h-3" />
            </button>
            {/* Change overlay */}
            <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition bg-black/20">
              <div className="bg-background rounded-lg px-3 py-1.5 text-xs font-medium shadow">
                {uploading ? "Uploading..." : "Click to change"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            )}
            <p className="text-sm font-medium text-muted-foreground">
              {uploading ? "Uploading..." : dragOver ? "Drop to upload" : "Click or drag image here"}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              JPG, PNG, WebP, GIF · max 8 MB · saves to /uploads/{folder}/
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
          <X className="w-3 h-3 shrink-0" />{error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
