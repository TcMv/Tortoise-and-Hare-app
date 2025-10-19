"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  maxRows?: number;
};

export function AutoTextarea({
  className,
  value,
  onChange,
  placeholder,
  maxRows = 5,
  ...props
}: Props) {
  const [text, setText] = React.useState<string>(typeof value === "string" ? value : "");
  const sizerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (typeof value === "string") setText(value);
  }, [value]);

  React.useEffect(() => {
    if (!sizerRef.current || !textareaRef.current) return;
    const lineHeightPx = getComputedStyle(textareaRef.current).lineHeight || "24px";
    const lineH = parseFloat(lineHeightPx);
    const maxH = lineH * maxRows;

    sizerRef.current.textContent = text.length ? text : " ";
    const needed = sizerRef.current.offsetHeight;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(needed, maxH) + "px";
    textareaRef.current.style.overflowY = needed > maxH ? "auto" : "hidden";
  }, [text, maxRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onChange?.(e);
  };

  return (
    <div className="relative min-w-0">
      <div
        ref={sizerRef}
        aria-hidden
        className={cn(
          "invisible absolute z-[-1] whitespace-pre-wrap break-words w-full box-border px-3 py-2 text-base md:text-sm rounded-md border border-transparent"
        )}
        style={{ pointerEvents: "none" }}
      />
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={1}
        className={cn(
          "block w-full min-w-0 resize-none box-border rounded-md border border-input bg-transparent px-3 py-2 text-base md:text-sm text-slate-900 dark:text-slate-100 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring whitespace-pre-wrap break-words overflow-x-hidden",
          className
        )}
        style={{ minHeight: 48, lineHeight: "1.5" }}
        {...props}
      />
    </div>
  );
}
