"use client";

import { useCallback, useEffect, useState } from "react";
import ActionDialog from "@/components/ActionDialog";
import Modal from "@/components/Modal";
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
  IconCheck,
  IconClose,
  IconPackage,
  IconPencil,
  IconPlus,
  IconReturn,
  IconSpinner,
  IconTrash,
  IconWarning,
} from "@/components/Icons";
import { api } from "@/lib/client";
import {
  ITEM_TYPE_LABELS,
  STATUS_LABELS,
  SUPPLY_KIND_LABELS,
  formatDate,
} from "@/lib/labels";

const EMPTY_REQUEST = { itemId: "", qty: 1, kind: "issue", purpose: "", dueDate: "" };
const EMPTY_ITEM = {
  code: "",
  name: "",
  category: "",
  unit: "ชิ้น",
  qty: 0,
  type: "consumable",
  location: "",
};

const TABS = [
  { id: "requests", label: "คำขอเบิก / ยืม" },
  { id: "items", label: "คลังพัสดุ" },
];

export default function SuppliesPage() {
  const [tab, setTab] = useState("requests");
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [requestForm, setRequestForm] = useState(null);
  const [itemForm, setItemForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [dialog, setDialog] = useState(null);

  const isOfficer = me?.role === "admin" || me?.role === "staff";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ user }, { requests: reqs }, { items: list }] = await Promise.all([
        api("/api/auth/me"),
        api("/api/supplies/requests"),
        api("/api/supplies/items"),
      ]);
      setMe(user);
      setRequests(reqs);
      setItems(list);
    } catch (e) {
      setToast({ type: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api("/api/supplies/requests", {
        method: "POST",
        body: { ...requestForm, qty: Number(requestForm.qty) },
      });
      setRequestForm(null);
      setToast({ type: "success", message: "ส่งคำขอเรียบร้อย รอเจ้าหน้าที่อนุมัติ" });
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitItem(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const body = { ...itemForm, qty: Number(itemForm.qty) };
      if (itemForm.id) {
        await api(`/api/supplies/items/${itemForm.id}`, { method: "PATCH", body });
        setToast({ type: "success", message: "แก้ไขข้อมูลพัสดุเรียบร้อย" });
      } else {
        await api("/api/supplies/items", { method: "POST", body });
        setToast({ type: "success", message: "เพิ่มพัสดุเรียบร้อย" });
      }
      setItemForm(null);
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
        message: `ยืนยันอนุมัติคำขอ ${request.code} — ${request.itemName} จำนวน ${request.qty} ${request.itemUnit}? ระบบจะตัดจำนวนคงเหลือในคลังทันที`,
        tone: "emerald",
        confirmLabel: "อนุมัติ",
        icon: IconCheck,
      },
      reject: {
        title: "ไม่อนุมัติคำขอ",
        message: `คำขอ ${request.code} จะถูกปิดโดยไม่ตัดสต๊อก`,
        tone: "rose",
        confirmLabel: "ไม่อนุมัติ",
        icon: IconClose,
        input: { label: "เหตุผลที่ไม่อนุมัติ", type: "textarea", required: true },
      },
      return: {
        title: "รับคืนพัสดุ",
        message: `ยืนยันรับคืน ${request.itemName} จำนวน ${request.qty} ${request.itemUnit}? ระบบจะคืนจำนวนเข้าคลัง`,
        tone: "brand",
        confirmLabel: "รับคืน",
        icon: IconReturn,
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
      run: async (note) => {
        await api(`/api/supplies/requests/${request.id}`, {
          method: "PATCH",
          body: { action, note: note || "" },
        });
        return `${presets[action].confirmLabel}คำขอ ${request.code} เรียบร้อย`;
      },
    });
  }

  function confirmRemoveItem(item) {
    setDialog({
      title: "ลบพัสดุ",
      message: `ยืนยันลบ "${item.name}" ออกจากคลัง? ลบไม่ได้หากยังมีคำขอที่ไม่ปิดรายการ`,
      tone: "rose",
      confirmLabel: "ลบพัสดุ",
      icon: IconTrash,
      run: async () => {
        await api(`/api/supplies/items/${item.id}`, { method: "DELETE" });
        return "ลบพัสดุเรียบร้อย";
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
  const visibleRequests = requests.filter((r) => {
    const matchStatus = !statusFilter || r.status === statusFilter;
    const text = `${r.code} ${r.itemName} ${r.itemCode} ${r.requesterName}`.toLowerCase();
    return matchStatus && text.includes(keyword.toLowerCase());
  });
  const visibleItems = items.filter((i) =>
    `${i.code} ${i.name} ${i.category}`.toLowerCase().includes(keyword.toLowerCase())
  );

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />

      <PageHeader
        title="งานพัสดุ"
        subtitle="การเบิกจ่ายวัสดุ และการยืม-คืนครุภัณฑ์ของแผนกวิชา"
      >
        <button
          className="btn-primary"
          onClick={() => {
            setRequestForm(EMPTY_REQUEST);
            setFormError("");
          }}
        >
          <IconPlus className="h-4 w-4" />
          สร้างคำขอ
        </button>
        {isOfficer ? (
          <button
            className="btn-ghost"
            onClick={() => {
              setItemForm(EMPTY_ITEM);
              setFormError("");
            }}
          >
            <IconPackage className="h-4 w-4" />
            เพิ่มพัสดุ
          </button>
        ) : null}
      </PageHeader>

      {/* แท็บ */}
      <div className="mb-5 flex animate-fade-up gap-1 rounded-xl border border-ink-200 bg-white p-1 shadow-soft sm:inline-flex">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 sm:flex-none ${
              tab === t.id
                ? "bg-brand-600 text-white shadow-soft"
                : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            {t.label}
            {t.id === "requests" && pendingCount > 0 ? (
              <span
                className={`ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                  tab === t.id ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}
              >
                {pendingCount}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="card animate-fade-up overflow-hidden stagger-1">
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-[1fr_auto]">
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            placeholder={
              tab === "requests"
                ? "ค้นหาเลขที่คำขอ / ชื่อพัสดุ / ผู้ขอ"
                : "ค้นหารหัส / ชื่อพัสดุ / หมวดหมู่"
            }
          />
          {tab === "requests" ? (
            <select
              className="select sm:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">ทุกสถานะ</option>
              {["pending", "approved", "returned", "rejected", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {loading ? (
          <TableSkeleton cols={6} />
        ) : tab === "requests" ? (
          visibleRequests.length === 0 ? (
            <EmptyState
              title="ไม่พบคำขอตามเงื่อนไข"
              description="ลองปรับคำค้นหรือเปลี่ยนตัวกรองสถานะ แล้วลองอีกครั้ง"
              icon={IconPackage}
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>เลขที่</th>
                    <th>ประเภท</th>
                    <th>พัสดุ</th>
                    <th className="text-right">จำนวน</th>
                    <th>ผู้ขอ</th>
                    <th>วันที่ขอ</th>
                    <th>กำหนดคืน</th>
                    <th>สถานะ</th>
                    <th className="col-sticky">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((r) => {
                    const overdue =
                      r.kind === "borrow" &&
                      r.status === "approved" &&
                      r.dueDate &&
                      r.dueDate < today;
                    return (
                      <tr key={r.id} className="group">
                        <td className="font-medium text-ink-900">{r.code}</td>
                        <td>
                          <Pill tone={r.kind === "borrow" ? "sky" : "slate"}>
                            {SUPPLY_KIND_LABELS[r.kind]}
                          </Pill>
                        </td>
                        <td>
                          <p className="font-medium text-ink-800">{r.itemName}</p>
                          <p className="text-xs text-ink-400">{r.itemCode}</p>
                        </td>
                        <td className="text-right tabular-nums">
                          {r.qty} {r.itemUnit}
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
                            {isOfficer && r.kind === "borrow" && r.status === "approved" ? (
                              <button
                                className="btn-chip text-brand-700 hover:bg-brand-50"
                                onClick={() => confirmAction(r, "return")}
                                title="รับคืนพัสดุ"
                                aria-label="รับคืนพัสดุ"
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
          )
        ) : visibleItems.length === 0 ? (
          <EmptyState
            title="ไม่พบพัสดุตามเงื่อนไข"
            description="ลองปรับคำค้น หรือเพิ่มรายการพัสดุใหม่เข้าคลัง"
            icon={IconPackage}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อพัสดุ</th>
                  <th>ประเภท</th>
                  <th>หมวดหมู่</th>
                  <th className="text-right">คงเหลือ</th>
                  <th>ที่จัดเก็บ</th>
                  {isOfficer ? <th className="col-sticky">จัดการ</th> : null}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((i) => (
                  <tr key={i.id} className="group">
                    <td className="font-medium text-ink-900">{i.code}</td>
                    <td className="text-ink-800">{i.name}</td>
                    <td>
                      <Pill tone={i.type === "durable" ? "violet" : "slate"}>
                        {ITEM_TYPE_LABELS[i.type]}
                      </Pill>
                    </td>
                    <td className="text-ink-600">{i.category}</td>
                    <td className="text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          i.qty === 0
                            ? "text-rose-600"
                            : i.qty <= 10
                              ? "text-amber-600"
                              : "text-ink-800"
                        }`}
                      >
                        {i.qty} {i.unit}
                      </span>
                    </td>
                    <td className="text-ink-600">{i.location || "—"}</td>
                    {isOfficer ? (
                      <td className="col-sticky">
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-chip text-ink-600 hover:bg-ink-100"
                            title="แก้ไขข้อมูลพัสดุ"
                            aria-label="แก้ไขข้อมูลพัสดุ"
                            onClick={() => {
                              setItemForm(i);
                              setFormError("");
                            }}
                          >
                            <IconPencil className="h-3.5 w-3.5" />
                            แก้ไข
                          </button>
                          <button
                            className="btn-chip text-rose-600 hover:bg-rose-50"
                            onClick={() => confirmRemoveItem(i)}
                            title="ลบพัสดุ"
                            aria-label="ลบพัสดุ"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* โมดัลสร้างคำขอ */}
      <Modal
        open={requestForm !== null}
        onClose={() => setRequestForm(null)}
        title="สร้างคำขอเบิก / ยืมพัสดุ"
        description="คำขอจะถูกส่งให้เจ้าหน้าที่พิจารณาอนุมัติ"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setRequestForm(null)}>
              ยกเลิก
            </button>
            <button
              className="btn-primary"
              type="submit"
              form="supply-request-form"
              disabled={saving}
            >
              {saving ? <IconSpinner /> : null}
              ส่งคำขอ
            </button>
          </>
        }
      >
        {requestForm ? (
          <form id="supply-request-form" onSubmit={submitRequest} className="space-y-4">
            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div>
              <label className="label">ประเภทคำขอ</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "issue", title: "เบิก", desc: "ใช้แล้วไม่ต้องคืน" },
                  { value: "borrow", title: "ยืม", desc: "ต้องคืนตามกำหนด" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRequestForm({ ...requestForm, kind: option.value })}
                    className={`rounded-xl border p-3.5 text-left transition duration-200 ${
                      requestForm.kind === option.value
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
              <label className="label">พัสดุ</label>
              <select
                className="select"
                value={requestForm.itemId}
                onChange={(e) => setRequestForm({ ...requestForm, itemId: e.target.value })}
                required
              >
                <option value="">— เลือกพัสดุ —</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.qty === 0}>
                    {i.code} — {i.name} (คงเหลือ {i.qty} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">จำนวน</label>
                <input
                  type="number"
                  min={1}
                  className="input"
                  value={requestForm.qty}
                  onChange={(e) => setRequestForm({ ...requestForm, qty: e.target.value })}
                  required
                />
              </div>
              {requestForm.kind === "borrow" ? (
                <div className="animate-fade-in">
                  <label className="label">กำหนดคืน</label>
                  <input
                    type="date"
                    className="input"
                    value={requestForm.dueDate}
                    min={today}
                    onChange={(e) =>
                      setRequestForm({ ...requestForm, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className="label">วัตถุประสงค์</label>
              <textarea
                className="input min-h-[88px] resize-y"
                value={requestForm.purpose}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, purpose: e.target.value })
                }
                placeholder="เช่น ใช้ในการจัดการเรียนการสอนวิชาเครือข่ายคอมพิวเตอร์"
              />
            </div>
          </form>
        ) : null}
      </Modal>

      {/* โมดัลจัดการพัสดุ */}
      <Modal
        open={itemForm !== null}
        onClose={() => setItemForm(null)}
        title={itemForm?.id ? "แก้ไขข้อมูลพัสดุ" : "เพิ่มพัสดุใหม่"}
        description={itemForm?.id ? itemForm.name : "บันทึกรายการพัสดุเข้าสู่คลัง"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setItemForm(null)}>
              ยกเลิก
            </button>
            <button
              className="btn-primary"
              type="submit"
              form="supply-item-form"
              disabled={saving}
            >
              {saving ? <IconSpinner /> : null}
              บันทึก
            </button>
          </>
        }
      >
        {itemForm ? (
          <form id="supply-item-form" onSubmit={submitItem} className="space-y-4">
            {formError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {formError}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">รหัสพัสดุ</label>
                <input
                  className="input"
                  value={itemForm.code}
                  onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                  disabled={Boolean(itemForm.id)}
                  placeholder="เช่น IT-004"
                  required
                />
              </div>
              <div>
                <label className="label">ประเภท</label>
                <select
                  className="select"
                  value={itemForm.type}
                  onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                >
                  {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">ชื่อพัสดุ</label>
              <input
                className="input"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">หมวดหมู่</label>
                <input
                  className="input"
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  placeholder="วัสดุคอมพิวเตอร์"
                />
              </div>
              <div>
                <label className="label">หน่วยนับ</label>
                <input
                  className="input"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="label">คงเหลือ</label>
                <input
                  type="number"
                  min={0}
                  className="input"
                  value={itemForm.qty}
                  onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">สถานที่จัดเก็บ</label>
              <input
                className="input"
                value={itemForm.location}
                onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                placeholder="เช่น ห้องพัสดุ 1"
              />
            </div>
          </form>
        ) : null}
      </Modal>

      <ActionDialog config={dialog} onConfirm={runDialog} onClose={() => setDialog(null)} />
    </>
  );
}
