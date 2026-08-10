"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/client";
import {
  FINANCE_KIND_LABELS,
  SUPPLY_KIND_LABELS,
  formatBaht,
  formatDateTime,
} from "@/lib/labels";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-secondary">กำลังโหลดข้อมูล...</div>;

  const isOfficer = data.role === "admin" || data.role === "staff";

  return (
    <>
      <div className="mb-4">
        <h1 className="h3 fw-bold mb-1">แดชบอร์ด</h1>
        <p className="text-secondary mb-0">
          {isOfficer
            ? "ภาพรวมงานพัสดุและงานการเงินของแผนกวิชา"
            : "ภาพรวมคำขอของคุณ"}
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard
            label="คำขอพัสดุรออนุมัติ"
            value={data.supply.pending}
            hint={`คำขอพัสดุทั้งหมด ${data.supply.total} รายการ`}
            accent="warning"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="รายการยืมที่ยังไม่คืน"
            value={data.supply.borrowed}
            hint={
              data.supply.overdue
                ? `เกินกำหนดคืน ${data.supply.overdue} รายการ`
                : "ไม่มีรายการเกินกำหนด"
            }
            accent={data.supply.overdue ? "danger" : "primary"}
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="คำขอการเงินรออนุมัติ"
            value={data.finance.pending}
            hint={`คำขอการเงินทั้งหมด ${data.finance.total} รายการ`}
            accent="warning"
          />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard
            label="ยอดจ่ายจริงสะสม"
            value={formatBaht(data.finance.paidAmount)}
            hint={`เงินยืมค้างล้างหนี้ ${formatBaht(data.finance.outstandingAdvance)}`}
            accent="success"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-6">
          <div className="card mis-card h-100">
            <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <span className="fw-semibold">คำขอพัสดุล่าสุด</span>
              <Link href="/dashboard/supplies" className="small">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="card-body pt-2">
              {data.recent.supply.length === 0 ? (
                <p className="text-secondary mb-0">ยังไม่มีรายการ</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <tbody>
                      {data.recent.supply.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="fw-semibold">{r.title}</div>
                            <div className="small text-secondary">
                              {r.code} · {SUPPLY_KIND_LABELS[r.kind]} {r.qty} ·{" "}
                              {isOfficer ? r.requesterName : formatDateTime(r.requestedAt)}
                            </div>
                          </td>
                          <td className="text-end">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card mis-card h-100">
            <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
              <span className="fw-semibold">คำขอการเงินล่าสุด</span>
              <Link href="/dashboard/finance" className="small">
                ดูทั้งหมด
              </Link>
            </div>
            <div className="card-body pt-2">
              {data.recent.finance.length === 0 ? (
                <p className="text-secondary mb-0">ยังไม่มีรายการ</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <tbody>
                      {data.recent.finance.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="fw-semibold">{r.title}</div>
                            <div className="small text-secondary">
                              {r.code} · {FINANCE_KIND_LABELS[r.kind]} ·{" "}
                              {formatBaht(r.amount)} ·{" "}
                              {isOfficer ? r.requesterName : formatDateTime(r.requestedAt)}
                            </div>
                          </td>
                          <td className="text-end">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card mis-card h-100">
            <div className="card-header bg-white border-0 pt-3 fw-semibold">
              พัสดุคงเหลือน้อย (≤ 10)
            </div>
            <div className="card-body pt-2">
              {data.stock.lowStock.length === 0 ? (
                <p className="text-secondary mb-0">
                  พัสดุทุกรายการมีจำนวนคงเหลือเพียงพอ
                </p>
              ) : (
                <ul className="list-group list-group-flush">
                  {data.stock.lowStock.map((i) => (
                    <li
                      key={i.id}
                      className="list-group-item d-flex justify-content-between px-0"
                    >
                      <span>
                        <span className="text-secondary small me-2">{i.code}</span>
                        {i.name}
                      </span>
                      <span
                        className={`fw-semibold ${i.qty === 0 ? "text-danger" : "text-warning"}`}
                      >
                        {i.qty} {i.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {data.users ? (
          <div className="col-12 col-xl-6">
            <div className="card mis-card h-100">
              <div className="card-header bg-white border-0 pt-3 d-flex justify-content-between align-items-center">
                <span className="fw-semibold">ผู้ใช้งานระบบ</span>
                <Link href="/dashboard/users" className="small">
                  จัดการผู้ใช้
                </Link>
              </div>
              <div className="card-body pt-2">
                <div className="row text-center">
                  <div className="col">
                    <div className="mis-stat-value">{data.users.total}</div>
                    <div className="small text-secondary">ทั้งหมด</div>
                  </div>
                  <div className="col">
                    <div className="mis-stat-value text-success">
                      {data.users.active}
                    </div>
                    <div className="small text-secondary">ใช้งานอยู่</div>
                  </div>
                  <div className="col">
                    <div className="mis-stat-value text-primary">
                      {data.users.byRole.admin || 0}
                    </div>
                    <div className="small text-secondary">ผู้ดูแลระบบ</div>
                  </div>
                  <div className="col">
                    <div className="mis-stat-value text-info">
                      {data.users.byRole.staff || 0}
                    </div>
                    <div className="small text-secondary">เจ้าหน้าที่</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
