"use client";
import React from "react";

export default function PrivacyModal({
  open,
  onClose,
  learnMoreHref,
}: {
  open: boolean;
  onClose: () => void;
  learnMoreHref: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6 text-slate-700 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Privacy Statement
        </h2>

        <p className="text-sm leading-relaxed mb-4">
          Your chat is private and not stored or monitored. Tortoise & Hare
          Wellness does not record or save your messages. If you choose to
          download a chat summary, it is processed locally on your device and
          never shared externally.
        </p>

        <p className="text-sm text-slate-500 mb-6">
          Learn more about our privacy practices on our main website.
        </p>

        <div className="flex justify-end gap-3">
          <a
            href={learnMoreHref}
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 hover:text-sky-700 text-sm font-medium"
          >
            Learn More
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
