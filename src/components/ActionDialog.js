"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import { IconSpinner, IconWarning } from "./Icons";

const TONES = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
};

const CONFIRM_CLASS = {
  brand: "btn-primary",
  emerald: "btn bg-emerald-600 text-white shadow-soft hover:bg-emerald-500",
  rose: "btn bg-rose-600 text-white shadow-soft hover:bg-rose-500",
  amber: "btn bg-amber-500 text-white shadow-soft hover:bg-amber-400",
};

/**
 * กล่องยืนยันการทำรายการ ใช้แทน window.confirm / window.prompt
 * @param {object} config { title, message, tone, confirmLabel, input }
 *        input: { label, type, defaultValue, placeholder, required, min, step }
 * @param {(value:string)=>Promise<void>} onConfirm
 */
export default function ActionDialog({ config, onConfirm, onClose }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValue(config?.input?.defaultValue ?? "");
    setError("");
  }, [config]);

  if (!config) return null;

  const { title, message, tone = "brand", confirmLabel = "ยืนยัน", input, icon } = config;
  const Icon = icon || IconWarning;

  async function submit(event) {
    event.preventDefault();
    if (input?.required && !String(value).trim()) {
      setError("กรุณากรอกข้อมูลก่อนยืนยัน");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onConfirm(value);
    } catch (e) {
      setError(e.message);
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <Modal open onClose={busy ? () => {} : onClose} title={title} size="sm">
      <form onSubmit={submit}>
        <div className="flex gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            {message ? <p className="text-sm text-ink-600">{message}</p> : null}

            {input ? (
              <div className="mt-4">
                <label className="label" htmlFor="action-dialog-input">
                  {input.label}
                </label>
                {input.type === "textarea" ? (
                  <textarea
                    id="action-dialog-input"
                    className="input min-h-[88px] resize-y"
                    value={value}
                    placeholder={input.placeholder}
                    onChange={(e) => setValue(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <input
                    id="action-dialog-input"
                    type={input.type || "text"}
                    className="input"
                    value={value}
                    placeholder={input.placeholder}
                    min={input.min}
                    step={input.step}
                    onChange={(e) => setValue(e.target.value)}
                    autoFocus
                  />
                )}
              </div>
            ) : null}

            {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            ยกเลิก
          </button>
          <button type="submit" className={CONFIRM_CLASS[tone]} disabled={busy}>
            {busy ? <IconSpinner /> : null}
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
