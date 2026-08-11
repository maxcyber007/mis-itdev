"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui";
import {
  IconArrowRight,
  IconBanknote,
  IconClock,
  IconPackage,
  IconReturn,
  IconTrendUp,
  IconUsers,
  IconWarning,
} from "@/components/Icons";
import { api } from "@/lib/client";
import {
  FINANCE_KIND_LABELS,
  SUPPLY_KIND_LABELS,
  formatBaht,
  formatDateTime,
} from "@/lib/labels";

function CardShell({ title, href, linkLabel, children, className = "" }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="group inline-flex items-center gap-1 text-sm font-medium text-brand-600 transition hover:text-brand-700"
          >
            {linkLabel}
            <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function RecentRow({ title, meta, right, status }) {
  return (
    <li className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-brand-50/40">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-800">{title}</p>
        <p className="mt-0.5 truncate text-xs text-ink-500">{meta}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {right ? (
          <span className="text-sm font-semibold tabular-nums text-ink-800">{right}</span>
        ) : null}
        <StatusBadge status={status} />
      </div>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card space-y-4 p-5">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((__, j) => (
              <Skeleton key={j} className="h-12 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="card flex items-start gap-3 border-rose-200 bg-rose-50 p-5 text-rose-700">
        <IconWarning className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const isOfficer = data.role === "admin" || data.role === "staff";

  return (
    <>
      <PageHeader
        title="แดชบอร์ด"
        subtitle={
          isOfficer
            ? "ภาพรวมงานพัสดุและงานการเงินของแผนกวิชา"
            : "ภาพรวมคำขอทั้งหมดของคุณ"
        }
      />

      {/* การ์ดตัวเลขสรุป */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          className="animate-fade-up"
          label="คำขอพัสดุรออนุมัติ"
          value={data.supply.pending}
          hint={`คำขอพัสดุทั้งหมด ${data.supply.total} รายการ`}
          icon={IconClock}
          tone="amber"
        />
        <StatCard
          className="animate-fade-up stagger-1"
          label="รายการยืมที่ยังไม่คืน"
          value={data.supply.borrowed}
          hint={
            data.supply.overdue
              ? `⚠ เกินกำหนดคืน ${data.supply.overdue} รายการ`
              : "ไม่มีรายการเกินกำหนด"
          }
          icon={IconReturn}
          tone={data.supply.overdue ? "rose" : "brand"}
        />
        <StatCard
          className="animate-fade-up stagger-2"
          label="คำขอการเงินรออนุมัติ"
          value={data.finance.pending}
          hint={`คำขอการเงินทั้งหมด ${data.finance.total} รายการ`}
          icon={IconBanknote}
          tone="amber"
        />
        <StatCard
          className="animate-fade-up stagger-3"
          label="ยอดจ่ายจริงสะสม"
          value={data.finance.paidAmount}
          format={formatBaht}
          hint={`เงินยืมค้างล้างหนี้ ${formatBaht(data.finance.outstandingAdvance)}`}
          icon={IconTrendUp}
          tone="emerald"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <CardShell
          className="animate-fade-up stagger-2"
          title="คำขอพัสดุล่าสุด"
          href="/dashboard/supplies"
          linkLabel="ดูทั้งหมด"
        >
          {data.recent.supply.length === 0 ? (
            <EmptyState
              title="ยังไม่มีคำขอพัสดุ"
              description="เมื่อมีการยื่นคำขอเบิกหรือยืมพัสดุ รายการจะแสดงที่นี่"
              icon={IconPackage}
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.recent.supply.map((r) => (
                <RecentRow
                  key={r.id}
                  title={r.title}
                  meta={`${r.code} · ${SUPPLY_KIND_LABELS[r.kind]} ${r.qty} · ${
                    isOfficer ? r.requesterName : formatDateTime(r.requestedAt)
                  }`}
                  status={r.status}
                />
              ))}
            </ul>
          )}
        </CardShell>

        <CardShell
          className="animate-fade-up stagger-3"
          title="คำขอการเงินล่าสุด"
          href="/dashboard/finance"
          linkLabel="ดูทั้งหมด"
        >
          {data.recent.finance.length === 0 ? (
            <EmptyState
              title="ยังไม่มีคำขอการเงิน"
              description="เมื่อมีการยื่นคำขอเบิกจ่ายหรือยืมเงิน รายการจะแสดงที่นี่"
              icon={IconBanknote}
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.recent.finance.map((r) => (
                <RecentRow
                  key={r.id}
                  title={r.title}
                  meta={`${r.code} · ${FINANCE_KIND_LABELS[r.kind]} · ${
                    isOfficer ? r.requesterName : formatDateTime(r.requestedAt)
                  }`}
                  right={formatBaht(r.amount)}
                  status={r.status}
                />
              ))}
            </ul>
          )}
        </CardShell>

        <CardShell
          className="animate-fade-up stagger-4"
          title="พัสดุคงเหลือน้อย"
          href="/dashboard/supplies"
          linkLabel="ไปที่คลังพัสดุ"
        >
          {data.stock.lowStock.length === 0 ? (
            <EmptyState
              title="พัสดุคงเหลือเพียงพอ"
              description="ยังไม่มีรายการที่คงเหลือ 10 หน่วยหรือน้อยกว่า"
              icon={IconPackage}
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.stock.lowStock.map((i) => {
                const ratio = Math.min((i.qty / 10) * 100, 100);
                return (
                  <li key={i.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-800">
                          {i.name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-400">{i.code}</p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          i.qty === 0 ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {i.qty} {i.unit}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                          i.qty === 0 ? "bg-rose-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.max(ratio, 4)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardShell>

        {data.users ? (
          <CardShell
            className="animate-fade-up stagger-5"
            title="ผู้ใช้งานระบบ"
            href="/dashboard/users"
            linkLabel="จัดการผู้ใช้"
          >
            <div className="grid grid-cols-2 gap-px bg-ink-100 sm:grid-cols-4">
              {[
                { label: "ทั้งหมด", value: data.users.total, tone: "text-ink-900" },
                { label: "ใช้งานอยู่", value: data.users.active, tone: "text-emerald-600" },
                {
                  label: "ผู้ดูแลระบบ",
                  value: data.users.byRole.admin || 0,
                  tone: "text-violet-600",
                },
                {
                  label: "เจ้าหน้าที่",
                  value: data.users.byRole.staff || 0,
                  tone: "text-sky-600",
                },
              ].map((cell) => (
                <div key={cell.label} className="bg-white px-4 py-6 text-center">
                  <p className={`text-2xl font-bold tabular-nums ${cell.tone}`}>
                    {cell.value}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">{cell.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-ink-100 px-5 py-3 text-xs text-ink-500">
              <IconUsers className="h-4 w-4 text-ink-400" />
              สิทธิ์การใช้งานแบ่งเป็น 3 ระดับ: ผู้ดูแลระบบ · เจ้าหน้าที่ · ผู้ใช้ทั่วไป
            </div>
          </CardShell>
        ) : null}
      </div>
    </>
  );
}
