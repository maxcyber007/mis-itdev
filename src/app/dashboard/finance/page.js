"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/client";
import {
  FINANCE_KIND_LABELS,
  STATUS_LABELS,
  formatBaht,
  formatDate,
  formatDateTime,
} from "@/lib/labels";

const EMPTY_FORM = {
  kind: "reimburse",
  title: "",
  category: "วัสดุการศึกษา",
  amount: "",
  dueDate: "",
};

const CATEGORIES = [
  "วัสดุการศึกษา",
  "ค่าตอบแทน",
  "ค่าใช้สอย",
  "ค่าเดินทางไปราชการ",
  "ค่าสาธารณูปโภค",
  "โครงการ/กิจกรรม",
  "อื่น ๆ",
];

export default function FinancePage() {
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const isOfficer = me?.role === "admin" || me?.role === "staff";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ user }, { requests: list }] = await Promise.all([
        api("/api/auth/me"),
        api("/api/finance/requests"),
      ]);
      setMe(user);
      setRequests(list);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api("/api/finance/requests", {
        method: "POST",
        body: { ...form, amount: Number(form.amount) },
      });
      setForm(null);
      setNotice("ส่งคำขอเรียบร้อย รอเจ้าหน้าที่อนุมัติ");
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function act(request, action) {
    const labels = {
      approve: "อนุมัติ",
      reject: "ไม่อนุมัติ",
      pay: "บันทึกการจ่ายเงิน",
      settle: "ล้างหนี้เงินยืม",
      cancel: "ยกเลิก",
    };
    const body = { action };

    if (action === "reject") {
      body.note = window.prompt("เหตุผลที่ไม่อนุมัติ") ?? "";
    } else if (action === "settle") {
      const input = window.prompt(
        `จำนวนเงินที่ใช้จริง (เงินยืม ${request.amount} บาท)`,
        String(request.amount)
      );
      if (input === null) return;
      body.settledAmount = Number(input);
    } else if (!window.confirm(`ยืนยัน${labels[action]} ${request.code}?`)) {
      return;
    }

    try {
      await api(`/api/finance/requests/${request.id}`, { method: "PATCH", body });
      setNotice(`${labels[action]} ${request.code} เรียบร้อย`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const visible = requests.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const text = `${r.code} ${r.title} ${r.category} ${r.requesterName}`.toLowerCase();
    return matchStatus && text.includes(keyword.toLowerCase());
  });

  const pendingAmount = requests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = requests
    .filter((r) => ["paid", "settled"].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);
  const outstanding = requests
    .filter((r) => r.kind === "advance" && r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">งานการเงิน</h1>
          <p className="text-secondary mb-0">
            การเบิกจ่ายเงิน และการยืม-คืนเงินทดรองราชการของแผนกวิชา
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
          }}
        >
          + สร้างคำขอ
        </button>
      </div>

      {error ? (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button className="btn-close" onClick={() => setError("")} />
        </div>
      ) : null}
      {notice ? (
        <div className="alert alert-success alert-dismissible">
          {notice}
          <button className="btn-close" onClick={() => setNotice("")} />
        </div>
      ) : null}

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <StatCard
            label="รออนุมัติ"
            value={formatBaht(pendingAmount)}
            hint={`${requests.filter((r) => r.status === "pending").length} รายการ`}
            accent="warning"
          />
        </div>
        <div className="col-12 col-md-4">
          <StatCard label="จ่ายแล้วสะสม" value={formatBaht(paidAmount)} accent="success" />
        </div>
        <div className="col-12 col-md-4">
          <StatCard
            label="เงินยืมค้างล้างหนี้"
            value={formatBaht(outstanding)}
            accent={outstanding > 0 ? "danger" : "secondary"}
          />
        </div>
      </div>

      <div className="card mis-card">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="ค้นหาเลขที่ / รายการ / หมวด / ผู้ขอ"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">ทุกสถานะ</option>
                {["pending", "approved", "paid", "settled", "rejected", "cancelled"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-secondary mb-0">กำลังโหลดข้อมูล...</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>เลขที่</th>
                    <th>ประเภท</th>
                    <th>รายการ</th>
                    <th className="text-end">จำนวนเงิน</th>
                    <th>ผู้ขอ</th>
                    <th>วันที่ขอ</th>
                    <th>กำหนดคืน</th>
                    <th>สถานะ</th>
                    <th className="text-end">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-secondary py-4">
                        ไม่พบคำขอตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    visible.map((r) => {
                      const overdue =
                        r.kind === "advance" &&
                        r.status === "paid" &&
                        r.dueDate &&
                        r.dueDate < today;
                      return (
                        <tr key={r.id}>
                          <td className="fw-semibold">{r.code}</td>
                          <td>
                            <span
                              className={`badge ${r.kind === "advance" ? "text-bg-info" : "text-bg-light"}`}
                            >
                              {FINANCE_KIND_LABELS[r.kind]}
                            </span>
                          </td>
                          <td>
                            <div>{r.title}</div>
                            <div className="small text-secondary">{r.category}</div>
                          </td>
                          <td className="text-end fw-semibold">
                            {formatBaht(r.amount)}
                            {r.settledAmount !== null &&
                            r.settledAmount !== undefined ? (
                              <div className="small text-secondary fw-normal">
                                ใช้จริง {formatBaht(r.settledAmount)}
                              </div>
                            ) : null}
                          </td>
                          <td>{r.requesterName}</td>
                          <td className="small text-secondary">
                            {formatDateTime(r.requestedAt)}
                          </td>
                          <td className={overdue ? "text-danger fw-semibold" : ""}>
                            {r.dueDate ? formatDate(r.dueDate) : "-"}
                            {overdue ? " (เกินกำหนด)" : ""}
                          </td>
                          <td>
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              {isOfficer && r.status === "pending" ? (
                                <>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => act(r, "approve")}
                                  >
                                    อนุมัติ
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => act(r, "reject")}
                                  >
                                    ไม่อนุมัติ
                                  </button>
                                </>
                              ) : null}
                              {isOfficer && r.status === "approved" ? (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => act(r, "pay")}
                                >
                                  จ่ายเงิน
                                </button>
                              ) : null}
                              {isOfficer && r.kind === "advance" && r.status === "paid" ? (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => act(r, "settle")}
                                >
                                  ล้างหนี้
                                </button>
                              ) : null}
                              {!isOfficer && r.status === "pending" ? (
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => act(r, "cancel")}
                                >
                                  ยกเลิก
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title="สร้างคำขอทางการเงิน"
        footer={
          <>
            <button className="btn btn-light" onClick={() => setForm(null)}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="finance-form"
              disabled={saving}
            >
              {saving ? "กำลังส่ง..." : "ส่งคำขอ"}
            </button>
          </>
        }
      >
        {form ? (
          <form id="finance-form" onSubmit={submit}>
            {formError ? <div className="alert alert-danger py-2">{formError}</div> : null}

            <div className="mb-3">
              <label className="form-label">ประเภทคำขอ</label>
              <select
                className="form-select"
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="reimburse">เบิกจ่าย (ขอเบิกเงินตามรายการ)</option>
                <option value="advance">ยืมเงิน (เงินทดรอง ต้องล้างหนี้)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">รายการที่ขอ</label>
              <input
                className="form-control"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น ค่าวัสดุฝึกวิชาเครือข่ายคอมพิวเตอร์"
                required
              />
            </div>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">หมวดรายจ่าย</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="form-control"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              {form.kind === "advance" ? (
                <div className="col-12">
                  <label className="form-label">กำหนดคืน / ล้างหนี้</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.dueDate}
                    min={today}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    required
                  />
                </div>
              ) : null}
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
