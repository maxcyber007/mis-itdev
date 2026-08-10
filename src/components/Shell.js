"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/labels";

const NAV = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: "📊", roles: ["admin", "staff", "user"] },
  { href: "/dashboard/supplies", label: "งานพัสดุ", icon: "📦", roles: ["admin", "staff", "user"] },
  { href: "/dashboard/finance", label: "งานการเงิน", icon: "💰", roles: ["admin", "staff", "user"] },
  { href: "/dashboard/users", label: "จัดการผู้ใช้", icon: "👥", roles: ["admin"] },
];

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => item.roles.includes(user.role));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="mis-shell">
      <aside className={`mis-sidebar ${open ? "is-open" : ""}`}>
        <div className="p-3 border-bottom border-light border-opacity-25">
          <div className="fw-bold fs-5">ระบบ MIS</div>
          <div className="small text-white-50">
            แผนกวิชาเทคโนโลยีสารสนเทศ
            <br />
            วิทยาลัยเทคนิคเชียงใหม่
          </div>
        </div>

        <nav className="p-2">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <span className="me-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open ? (
        <div className="mis-backdrop d-lg-none" onClick={() => setOpen(false)} />
      ) : null}

      <div className="mis-content">
        <header className="d-flex align-items-center justify-content-between mb-4">
          <button
            type="button"
            className="btn btn-outline-secondary d-lg-none"
            onClick={() => setOpen((v) => !v)}
            aria-label="เปิดเมนู"
          >
            ☰
          </button>

          <div className="ms-auto d-flex align-items-center gap-3">
            <div className="text-end lh-sm">
              <div className="fw-semibold">{user.name}</div>
              <div className="small text-secondary">
                {ROLE_LABELS[user.role] || user.role}
              </div>
            </div>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              ออกจากระบบ
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
