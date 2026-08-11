"use client";

import { useEffect } from "react";
import { IconCheck, IconClose, IconWarning } from "./Icons";

/**
 * แถบแจ้งเตือนมุมขวาบน ปิดเองอัตโนมัติ
 * @param {"success"|"error"} type
 */
export default function Toast({ type = "success", message, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const success = type === "success";
  const Icon = success ? IconCheck : IconWarning;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex justify-center sm:inset-x-auto sm:right-6 sm:justify-end">
      <div
        role="status"
        className={`pointer-events-auto relative flex w-full max-w-sm animate-fade-down items-start gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-lift ${
          success ? "border-emerald-200" : "border-rose-200"
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            success ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <p className="flex-1 pt-0.5 text-sm text-ink-700">{message}</p>

        <button
          type="button"
          aria-label="ปิดการแจ้งเตือน"
          onClick={onClose}
          className="rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
        >
          <IconClose className="h-4 w-4" />
        </button>

        <span
          className={`absolute inset-x-0 bottom-0 h-0.5 origin-left ${
            success ? "bg-emerald-400" : "bg-rose-400"
          }`}
          style={{ animation: `toast-progress ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
