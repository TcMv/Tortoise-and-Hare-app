import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** max visible rows before scrolling */
  maxRows?: number;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  ({ className, maxRows = 5, value, onInput, ...props }, ref) => {
    const elRef = React.useRef<HTMLTextAreaElement | null>(null);

    // pass through the ref
    React.useImperativeHandle(ref, () => elRef.current as HTMLTextAreaElement);

    const resize = React.useCallback(() => {
      const el = elRef.current;
      if (!el) return;
      el.style.height = "auto";
      const line = parseFloat(getComputedStyle(el).lineHeight || "22");
      const maxH = line * maxRows;
      el.style.height = Math.min(el.scrollHeight, maxH) + "px";
      el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    }, [maxRows]);

    // Grow on user input
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      onInput?.(e);
      resize();
    };

    // 🔹 Shrink back after send (when parent sets value to "")
    React.useEffect(() => {
      if (typeof value === "string" && value.length === 0 && elRef.current) {
        elRef.current.style.height = "auto";
        elRef.current.style.overflowY = "hidden";
      } else {
        // keep size in sync when value changes programmatically
        resize();
      }
    }, [value, resize]);

    return (
      <textarea
        ref={elRef}
        value={value}
        onInput={handleInput}
        rows={1}
        wrap="soft"
        className={cn(
          "block w-full resize-none rounded-md border border-input bg-white/70 dark:bg-slate-900/50",
          "text-base text-slate-900 dark:text-slate-100 px-3 py-2 shadow-sm",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words",
          className
        )}
        style={{ minHeight: "44px" }}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
