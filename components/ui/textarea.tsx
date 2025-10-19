import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto"; // reset
    el.style.height = Math.min(el.scrollHeight, 120) + "px"; // grow to ~5 lines
  };

  return (
    <textarea
      ref={ref}
      onInput={handleInput}
      rows={1}
      wrap="soft"
      className={cn(
        // ✅ stripped-down, bulletproof
        "block w-full resize-none rounded-md border border-input bg-white/70 dark:bg-slate-900/50 text-base text-slate-900 dark:text-slate-100 px-3 py-2 shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words",
        className
      )}
      style={{
        minHeight: "60px",
        maxHeight: "120px",
        lineHeight: "1.5",
        width: "100%",
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
