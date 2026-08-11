"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/labels";
import {
  IconClose,
  IconDashboard,
  IconLogout,
  IconMenu,
  IconPackage,
  IconUsers,
  IconWallet,
} from "./Icons";

const NAV = [
  {
    href: "/dashboard",
    label: "แดชบอร์ด",
    icon: IconDashboard,
    roles: ["admin", "staff", "user"],
  },
  {
    href: "/dashboard/supplies",
    label: "งานพัสดุ",
    icon: IconPackage,
    roles: ["admin", "staff", "user"],
  },
  {
    href: "/dashboard/finance",
    label: "งานการเงิน",
    icon: IconWallet,
    roles: ["admin", "staff", "user"],
  },
  { href: "/dashboard/users", label: "จัดการผู้ใช้", icon: IconUsers, roles: ["admin"] },
];

// เขียนคลาสหน่วงเวลาแบบตรงตัว เพื่อให้ Tailwind เก็บคลาสเหล่านี้ไว้ตอน build
const STAGGER = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"];

const ROLE_TONE = {
  admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
  staff: "bg-sky-50 text-sky-700 ring-sky-600/20",
  user: "bg-ink-100 text-ink-600 ring-ink-500/15",
};

function initials(name) {
  return (name || "?").trim().charAt(0).toUpperCase();
}

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const items = NAV.filter((item) => item.roles.includes(user.role));
  const current = items.find((item) =>
    item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
  );

  // ปิดเมนูอัตโนมัติเมื่อเปลี่ยนหน้าบนจอเล็ก
  useEffect(() => setOpen(false), [pathname]);

  async function handleLogout() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      {/* ฉากหลังเมนูบนจอเล็ก */}
      {open ? (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-ink-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col bg-brand-950 transition-transform duration-300 ease-out lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* แสงพื้นหลังของแถบเมนู */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 top-0 h-64 w-64 animate-aurora-1 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-56 w-56 animate-aurora-2 rounded-full bg-sky-400/15 blur-3xl" />
        </div>

        <div className="relative flex items-center gap-3 px-5 py-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base font-bold text-white ring-1 ring-inset ring-white/20 backdrop-blur">
            IT
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">ระบบ MIS</p>
            <p className="truncate text-xs leading-relaxed text-white/55">
              แผนกวิชาเทคโนโลยีสารสนเทศ
              <br />
              วิทยาลัยเทคนิคเชียงใหม่
            </p>
          </div>
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          <p className="px-3 pb-2 pt-3 text-[0.7rem] font-semibold uppercase tracking-wider text-white/35">
            เมนูหลัก
          </p>
          {items.map((item, index) => {
            const active = current?.href === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link group animate-slide-in-left ${STAGGER[index] || ""} ${
                  active ? "nav-link-active" : ""
                }`}
              >
                {active ? (
                  <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-300" />
                ) : null}
                <Icon
                  className={`h-[1.15rem] w-[1.15rem] transition-transform duration-200 ${
                    active ? "text-brand-200" : "group-hover:scale-110"
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-white/50">
                {ROLE_LABELS[user.role] || user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-20 border-b border-ink-200/70 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              aria-label="เปิดเมนู"
              onClick={() => setOpen(true)}
              className="rounded-xl border border-ink-200 p-2 text-ink-600 transition hover:bg-ink-50 lg:hidden"
            >
              <IconMenu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {current?.label || "ระบบ MIS"}
              </p>
              <p className="hidden text-xs text-ink-500 sm:block">
                แผนกวิชาเทคโนโลยีสารสนเทศ · วิทยาลัยเทคนิคเชียงใหม่
              </p>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span
                className={`badge hidden sm:inline-flex ${ROLE_TONE[user.role] || ROLE_TONE.user}`}
              >
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="btn-ghost btn-sm gap-1.5 text-ink-600 hover:text-rose-600"
              >
                <IconLogout className="h-4 w-4" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
