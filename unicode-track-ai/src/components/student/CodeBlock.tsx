"use client";

import React, { useState } from "react";
import { Copy, Check, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Read-only code block with slate-900 background and syntax highlighting
 * strictly limited to indigo, cyan, and slate tints.
 */
export function CodeBlock({
  code,
  filename,
  highlightLine,
  className,
}: {
  code: string;
  filename?: string;
  highlightLine?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const lines = code.split("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard failures
    }
  };

  const renderTokens = (line: string) => {
    // Simple tokenizer using only indigo, cyan, and slate tints
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("--")) {
      return <span className="text-slate-400 italic">{line}</span>;
    }

    const parts = line.split(/(\b(?:const|let|async|await|return|export|function|interface|SELECT|FROM|WHERE|CREATE|TABLE|PRIMARY|KEY|REFERENCES|import|from)\b|"[^"]*"|'[^']*')/g);
    return parts.map((part, i) => {
      if (
        /^(const|let|async|await|return|export|function|interface|SELECT|FROM|WHERE|CREATE|TABLE|PRIMARY|KEY|REFERENCES|import|from)$/.test(
          part
        )
      ) {
        return (
          <span key={i} className="text-indigo-300 font-medium">
            {part}
          </span>
        );
      }
      if (/^["'].*["']$/.test(part)) {
        return (
          <span key={i} className="text-cyan-300">
            {part}
          </span>
        );
      }
      return (
        <span key={i} className="text-slate-100">
          {part}
        </span>
      );
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden",
        className
      )}
    >
      {filename && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <FileCode2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>{filename}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Copy code snippet"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      )}

      <pre className="p-4 overflow-x-auto text-xs leading-6 font-mono bg-slate-900 text-slate-100 m-0 border-0 rounded-none">
        <code>
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = highlightLine === lineNum;
            return (
              <div
                key={lineNum}
                className={cn(
                  "flex gap-4 px-2 -mx-2 rounded",
                  isHighlighted && "bg-cyan-500/15 border-l-2 border-cyan-400"
                )}
              >
                <span className="w-7 text-right select-none text-slate-500 shrink-0 tabular-nums">
                  {lineNum}
                </span>
                <span className="whitespace-pre">{renderTokens(line)}</span>
              </div>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
