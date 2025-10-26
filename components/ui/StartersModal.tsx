// components/ui/StartersModal.tsx
"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

export type Starter = { id: string; label: string; prompt: string };

export default function StartersModal({
  open,
  starters,
  onSelect,
  onClose,
  title = "Welcome",
  subtitle = "Hi there 👋, welcome to Tortoise and Hare Wellness. I am here to support you. How do you want to get started today?",
}: {
  open: boolean;
  starters: Starter[];
  onSelect: (starter: Starter) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}) {
  if (!open) return null;

  const content = (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-screen h-[100svh] max-w-none rounded-none bg-white shadow-lg p-4
                      sm:w-full sm:h-auto sm:max-w-xl sm:max-h-[85vh] sm:rounded-2xl sm:p-6 sm:mx-auto sm:my-8
                      flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b flex-shrink-0 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-[#5F6B7A] mt-1">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 border text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 min-h-0 overflow-y-auto mt-4 space-y-3 pb-4">
          {starters.map((s) => (
            <Button
              key={s.id}
              variant="secondary"
              className="w-full justify-start h-auto py-3 text-left"
              onClick={() => onSelect(s)}
            >
              {s.label}
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Maybe later</Button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
