"use client";

import { useEffect, useRef, useState } from "react";

const TONES = {
  brand: {
    ring: "ring-brand-500/15",
    icon: "bg-brand-50 text-brand-600",
    glow: "from-brand-500/10",
    value: "text-ink-900",
  },
  amber: {
    ring: "ring-amber-500/15",
    icon: "bg-amber-50 text-amber-600",
    glow: "from-amber-500/10",
    value: "text-ink-900",
  },
  emerald: {
    ring: "ring-emerald-500/15",
    icon: "bg-emerald-50 text-emerald-600",
    glow: "from-emerald-500/10",
    value: "text-ink-900",
  },
  rose: {
    ring: "ring-rose-500/15",
    icon: "bg-rose-50 text-rose-600",
    glow: "from-rose-500/10",
    value: "text-ink-900",
  },
  slate: {
    ring: "ring-ink-500/10",
    icon: "bg-ink-100 text-ink-500",
    glow: "from-ink-500/5",
    value: "text-ink-900",
  },
};

/** นับตัวเลขขึ้นจาก 0 ด้วย easing เพื่อให้ตัวเลขบนการ์ดมีชีวิต */
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const numeric = Number(target);
    if (!Number.isFinite(numeric)) return undefined;

    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(numeric * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}

/**
 * การ์ดตัวเลขสรุป
 * @param {number} value ค่าตัวเลขที่จะนับขึ้น
 * @param {(n:number)=>string} [format] ฟังก์ชันจัดรูปแบบค่า (เช่น สกุลเงินบาท)
 */
export default function StatCard({
  label,
  value,
  format,
  hint,
  icon: Icon,
  tone = "brand",
  className = "",
}) {
  const animated = useCountUp(value);
  const t = TONES[tone] || TONES.brand;
  const display = format ? format(animated) : Math.round(animated).toLocaleString("th-TH");

  return (
    <div
      className={`card card-hover group relative overflow-hidden p-5 ring-1 ${t.ring} ${className}`}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${t.glow} to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-70`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${t.value} sm:text-[1.75rem]`}
          >
            {display}
          </p>
        </div>
        {Icon ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.icon} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
      </div>

      {hint ? <p className="relative mt-3 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
