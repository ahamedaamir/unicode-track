"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { LinearProgressBar } from "./ProgressIndicators";

export function UploadDropzone({
  accept = ".pdf,.png,.svg,.zip",
  label = "Drag and drop your deliverable here, or browse",
  helperText = "PDF, PNG, SVG, or ZIP up to 25 MB",
  onFileSelected,
  className,
}: {
  accept?: string;
  label?: string;
  helperText?: string;
  onFileSelected?: (file: File) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setProgress(35);
    setTimeout(() => setProgress(75), 180);
    setTimeout(() => setProgress(100), 400);
    onFileSelected?.(file);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
          dragging
            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
            : "border-[var(--neutral-border)] bg-[var(--neutral-bg)] hover:border-[var(--primary)]/60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="mx-auto w-11 h-11 rounded-xl bg-[var(--neutral-card)] border border-[var(--neutral-border)] flex items-center justify-center text-[var(--primary)] dark:text-indigo-300">
          <UploadCloud className="w-5 h-5" aria-hidden="true" />
        </div>
        <p className="mt-3 text-sm font-medium text-[var(--neutral-text)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--neutral-muted)]">{helperText}</p>
      </div>

      {selectedFile && (
        <div className="rounded-xl border border-[var(--neutral-border)] bg-[var(--neutral-card)] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-[var(--neutral-text)] truncate">
                {selectedFile.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setProgress(0);
              }}
              aria-label="Remove uploaded file"
              className="p-1 rounded-lg text-[var(--neutral-muted)] hover:text-[var(--neutral-text)] hover:bg-[var(--neutral-surface)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <LinearProgressBar value={progress} label={progress < 100 ? "Uploading..." : "Ready for submission"} />
        </div>
      )}
    </div>
  );
}
