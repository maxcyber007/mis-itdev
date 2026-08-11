"use client";

import { useEffect } from "react";
import { IconClose } from "./Icons";

/**
 * โมดัลควบคุมด้วย React พร้อมอนิเมชันเข้าฉาก
 * ปิดได้ด้วยปุ่ม Esc, คลิกฉากหลัง หรือปุ่มกากบาท
 */
export default function Modal({
  title,
  description,
  open,
  onClose,
  children,
  footer,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink-950/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full ${widths[size]} animate-scale-in flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-ink-500">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            className="-mr-2 -mt-1 rounded-lg p-2 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
