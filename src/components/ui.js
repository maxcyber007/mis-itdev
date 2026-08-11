"use client";

import { IconInbox, IconSearch } from "./Icons";

/** หัวเรื่องของหน้า พร้อมพื้นที่วางปุ่มด้านขวา */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-500">{subtitle}</p> : null}
      </div>
      {children ? (
        <div className="flex animate-fade-up flex-wrap gap-2 stagger-1">{children}</div>
      ) : null}
    </div>
  );
}

/** ช่องค้นหาพร้อมไอคอน */
export function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
      <input
        className="input pl-10"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** โครงร่างระหว่างโหลดข้อมูล (shimmer) */
export function Skeleton({ className = "h-4 w-full" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-ink-100 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 5 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-5 ${c === 0 ? "w-2/3" : "w-full"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** สถานะว่าง */
export function EmptyState({ title, description, icon: Icon = IconInbox, children }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-medium text-ink-700">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/** ป้ายเล็กแบบกลาง ๆ ใช้กับประเภทรายการ */
export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-ink-100 text-ink-600 ring-ink-500/10",
    sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
    brand: "bg-brand-50 text-brand-700 ring-brand-600/20",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}
