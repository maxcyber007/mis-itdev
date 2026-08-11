"use client";

import { useCallback, useEffect, useState } from "react";
import ActionDialog from "@/components/ActionDialog";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import Toast from "@/components/Toast";
import {
  EmptyState,
  PageHeader,
  Pill,
  SearchInput,
  TableSkeleton,
} from "@/components/ui";
import {
  IconBanknote,
  IconCheck,
  IconClock,
  IconClose,
  IconPlus,
  IconReturn,
  IconSpinner,
  IconTrendUp,
  IconWarning,
} from "@/components/Icons";
import { api } from "@/lib/client";
import {
  FINANCE_KIND_LABELS,
  STATUS_LABELS,
  formatBaht,
  formatDate,
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
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [dialog, setDialog] = useState(null);

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
    } catch (e) {
      setToast({ type: "error", message: e.message });
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
      setToast({ type: "success", message: "ส่งคำขอเรียบร้อย รอเจ้าหน้าที่อนุมัติ" });
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmAction(request, action) {
    const presets = {
      approve: {
        title: "อนุมัติคำขอ",
        message: `ยืนยันอนุมัติ ${request.code} — ${request.title} จำนวน ${formatBaht(request.amount)}?`,
        tone: "emerald",
        confirmLabel: "อนุมัติ",
        icon: IconCheck,
      },
      reject: {
        title: "ไม่อนุมัติคำขอ",
        message: `คำขอ ${request.code} จะถูกปิดโดยไม่มีการจ่ายเงิน`,
        tone: "rose",
        confirmLabel: "ไม่อนุมัติ",
        icon: IconClose,
        input: { label: "เหตุผลที่ไม่อนุมัติ", type: "textarea", required: true },
      },
      pay: {
        title: "บันทึกการจ่ายเงิน",
        message: `ยืนยันจ่ายเงิน ${formatBaht(request.amount)} สำหรับ ${request.code}?`,
        tone: "brand",
        confirmLabel: "บันทึกการจ่ายเงิน",
        icon: IconBanknote,
      },
      settle: {
        title: "ล้างหนี้เงินยืม",
        message: `เงินยืมของ ${request.code} จำนวน ${formatBaht(request.amount)} — กรอกยอดที่ใช้จริงเพื่อปิดรายการ`,
        tone: "brand",
        confirmLabel: "ล้างหนี้",
        icon: IconReturn,
        input: {
          label: "จำนวนเงินที่ใช้จริง (บาท)",
          type: "number",
          min: 0,
          step: "0.01",
          defaultValue: String(request.amount),
          required: true,
        },
      },
      cancel: {
        title: "ยกเลิกคำขอ",
        message: `ยืนยันยกเลิกคำขอ ${request.code}?`,
        tone: "amber",
        confirmLabel: "ยกเลิกคำขอ",
      },
    };

    setDialog({
      ...presets[action],
      run: async (value) => {
        const body = { action };
        if (action === "settle") body.settledAmount = Number(value);
        else if (action === "reject") body.note = value || "";
        await api(`/api/finance/requests/${request.id}`, { method: "PATCH", body });
        return `${presets[action].confirmLabel} ${request.code} เรียบร้อย`;
      },
    });
  }

  async function runDialog(value) {
    const message = await dialog.run(value);
    setDialog(null);
    setToast({ type: "success", message });
    await load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const visible = requests.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const text = `${r.code} ${r.title} ${r.category} ${r.requesterName}`.toLowerCase();
    return matchStatus && text.includes(keyword.toLowerCase());
  });

  const pending = requests.filter((r) => r.status === "pending");
  const pendingAmount = pending.reduce((sum, r) => sum + r.amount, 0);
  const paidAmount = requests
    .filter((r) => ["paid", "settled"].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);
  const outstanding = requests
    .filter((r) => r.kind === "advance" && r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />

      <PageHeader
        title="งานการเงิน"
        subtitle="การเบิกจ่ายเงิน และการยืม-คืนเงินทดรองราชการของแผนกวิชา"
      >
        <button
          className="btn-primary"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
          }}
        >
          <IconPlus className="h-4 w-4" />
          สร้างคำขอ
        </button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          className="animate-fade-up"
          label="รออนุมัติ"
          value={pendingAmount}
          format={formatBaht}
          hint={`${pending.length} รายการ`}
          icon={IconClock}
          tone="amber"
        />
        <StatCard
          className="animate-fade-up stagger-1"
          label="จ่ายแล้วสะสม"
          value={paidAmount}
          format={formatBaht}
          icon={IconTrendUp}
          tone="emerald"
        />
        <StatCard
          className="animate-fade-up stagger-2"
          label="เงินยืมค้างล้างหนี้"
          value={outstanding}
          format={formatBaht}
          icon={IconBanknote}
          tone={outstanding > 0 ? "rose" : "slate"}
        />
      </div>

      <div className="card mt-6 animate-fade-up overflow-hidden stagger-3">
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-[1fr_auto]">
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            placeholder="ค้นหาเลขที่ / รายการ / หมวดรายจ่าย / ผู้ขอ"
          />
          <select
            className="select sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {["pending", "approved", "paid", "settled", "rejected", "cancelled"].map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton cols={6} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="ไม่พบคำขอตามเงื่อนไข"
            description="ลองปรับคำค้นหรือเปลี่ยนตัวกรองสถานะ แล้วลองอีกครั้ง"
            icon={IconBanknote}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>เลขที่</th>
                  <th>ประเภท</th>
                  <th>รายการ</th>
                  <th className="text-right">จำนวนเงิน</th>
                  <th>ผู้ขอ</th>
                  <th>วันที่ขอ</th>
                  <th>กำหนดคืน</th>
                  <th>สถานะ</th>
                  <th className="col-sticky">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const overdue =
                    r.kind === "advance" &&
                    r.status === "paid" &&
                    r.dueDate &&
                    r.dueDate < today;
                  return (
                    <tr key={r.id} className="group">
                      <td className="font-medium text-ink-900">{r.code}</td>
                      <td>
                        <Pill tone={r.kind === "advance" ? "sky" : "slate"}>
                          {FINANCE_KIND_LABELS[r.kind]}
                        </Pill>
                      </td>
                      <td>
                        <p className="font-medium text-ink-800">{r.title}</p>
                        <p className="text-xs text-ink-400">{r.category}</p>
                      </td>
                      <td className="text-right">
                        <span className="font-semibold tabular-nums text-ink-900">
                          {formatBaht(r.amount)}
                        </span>
                        {r.settledAmount !== null && r.settledAmount !== undefined ? (
                          <p className="text-xs text-ink-400">
                            ใช้จริง {formatBaht(r.settledAmount)}
                          </p>
                        ) : null}
                      </td>
                      <td>
                          <span
                            className="block max-w-[150px] truncate"
                            title={r.requesterName}
                          >
                            {r.requesterName}
                          </span>
                        </td>
                      <td className="text-xs text-ink-500">{formatDate(r.requestedAt)}</td>
                      <td>
                        {r.dueDate ? (
                          <span
                            className={
                              overdue ? "font-medium text-rose-600" : "text-ink-600"
                            }
                          >
                            {formatDate(r.dueDate)}
                            {overdue ? (
                              <span title="เกินกำหนดคืน">
                                <IconWarning className="ml-1 inline h-3.5 w-3.5 align-[-2px]" />
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="col-sticky">
                        <div className="flex justify-end gap-1">
                          {isOfficer && r.status === "pending" ? (
                            <>
                              <button
                                className="btn-chip text-emerald-700 hover:bg-emerald-50"
                                onClick={() => confirmAction(r, "approve")}
                                title="อนุมัติ"
                                aria-label="อนุมัติ"
                              >
                                <IconCheck className="h-4 w-4" />
                              </button>
                              <button
                                className="btn-chip text-rose-600 hover:bg-rose-50"
                                onClick={() => confirmAction(r, "reject")}
                                title="ไม่อนุมัติ"
                                aria-label="ไม่อนุมัติ"
                              >
                                <IconClose className="h-4 w-4" />
                              </button>
                            </>
                          ) : null}
                          {isOfficer && r.status === "approved" ? (
                            <button
                              className="btn-chip text-brand-700 hover:bg-brand-50"
                              onClick={() => confirmAction(r, "pay")}
                              title="บันทึกการจ่ายเงิน"
                              aria-label="บันทึกการจ่ายเงิน"
                            >
                              <IconBanknote className="h-4 w-4" />
                            </button>
                          ) : null}
                          {isOfficer && r.kind === "advance" && r.status === "paid" ? (
                            <button
                              className="btn-chip text-brand-700 hover:bg-brand-50"
                              onClick={() => confirmAction(r, "settle")}
                              title="ล้างหนี้เงินยืม"
                              aria-label="ล้างหนี้เงินยืม"
                            >
                              <IconReturn className="h-4 w-4" />
                            </button>
                          ) : null}
                          {!isOfficer && r.status === "pending" ? (
                            <button
                              className="btn-chip text-ink-600 hover:bg-ink-100"
                              onClick={() => confirmAction(r, "cancel")}
                            >
                              ยกเลิก
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={form !== null}
        onClose={() => setForm(null)}
        title="สร้างคำขอทางการเงิน"
        description="คำขอจะถูกส่งให้เจ้าหน้าที่พิจารณาอนุมัติ"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setForm(null)}>
              ยกเลิก
            </button>
            <button className="btn-primary" type="submit" form="finance-form" disabled={saving}>
              {saving ? <IconSpinner /> : null}
              ส่งคำขอ
            </button>
          </>
        }
      >
        {form ? (
          <form id="finance-form" onSubmit={submit} className="space-y-4">
            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div>
              <label className="label">ประเภทคำขอ</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "reimburse", title: "เบิกจ่าย", desc: "ขอเบิกเงินตามรายการ" },
                  { value: "advance", title: "ยืมเงิน", desc: "เงินทดรอง ต้องล้างหนี้" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, kind: option.value })}
                    className={`rounded-xl border p-3.5 text-left transition duration-200 ${
                      form.kind === option.value
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20"
                        : "border-ink-200 hover:border-ink-300 hover:bg-ink-50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink-900">{option.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">รายการที่ขอ</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="เช่น ค่าวัสดุฝึกวิชาเครือข่ายคอมพิวเตอร์"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">หมวดรายจ่าย</label>
                <select
                  className="select"
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
              <div>
                <label className="label">จำนวนเงิน (บาท)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {form.kind === "advance" ? (
              <div className="animate-fade-in">
                <label className="label">กำหนดคืน / ล้างหนี้</label>
                <input
                  type="date"
                  className="input"
                  value={form.dueDate}
                  min={today}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  required
                />
              </div>
            ) : null}
          </form>
        ) : null}
      </Modal>

      <ActionDialog config={dialog} onConfirm={runDialog} onClose={() => setDialog(null)} />
    </>
  );
}
