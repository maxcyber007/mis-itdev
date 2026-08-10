"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/client";
import {
  ITEM_TYPE_LABELS,
  STATUS_LABELS,
  SUPPLY_KIND_LABELS,
  formatDate,
  formatDateTime,
} from "@/lib/labels";

const EMPTY_REQUEST = {
  itemId: "",
  qty: 1,
  kind: "issue",
  purpose: "",
  dueDate: "",
};

const EMPTY_ITEM = {
  code: "",
  name: "",
  category: "",
  unit: "ชิ้น",
  qty: 0,
  type: "consumable",
  location: "",
};

export default function SuppliesPage() {
  const [tab, setTab] = useState("requests");
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [requestForm, setRequestForm] = useState(null);
  const [itemForm, setItemForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      setNotice("ส่งคำขอเรียบร้อย รอเจ้าหน้าที่อนุมัติ");
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
        setNotice("แก้ไขข้อมูลพัสดุเรียบร้อย");
      } else {
        await api("/api/supplies/items", { method: "POST", body });
        setNotice("เพิ่มพัสดุเรียบร้อย");
      }
      setItemForm(null);
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
      return: "รับคืน",
      cancel: "ยกเลิก",
    };
    let note = "";
    if (action === "reject") {
      note = window.prompt("เหตุผลที่ไม่อนุมัติ") ?? "";
    } else if (!window.confirm(`ยืนยัน${labels[action]}คำขอ ${request.code}?`)) {
      return;
    }
    try {
      await api(`/api/supplies/requests/${request.id}`, {
        method: "PATCH",
        body: { action, note },
      });
      setNotice(`${labels[action]}คำขอ ${request.code} เรียบร้อย`);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`ยืนยันลบพัสดุ ${item.name}?`)) return;
    try {
      await api(`/api/supplies/items/${item.id}`, { method: "DELETE" });
      setNotice("ลบพัสดุเรียบร้อย");
      await load();
    } catch (e) {
      setError(e.message);
    }
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

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">งานพัสดุ</h1>
          <p className="text-secondary mb-0">
            การเบิกจ่ายวัสดุ และการยืม-คืนครุภัณฑ์ของแผนกวิชา
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              setRequestForm(EMPTY_REQUEST);
              setFormError("");
            }}
          >
            + สร้างคำขอ
          </button>
          {isOfficer ? (
            <button
              className="btn btn-outline-primary"
              onClick={() => {
                setItemForm(EMPTY_ITEM);
                setFormError("");
              }}
            >
              + เพิ่มพัสดุ
            </button>
          ) : null}
        </div>
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

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "requests" ? "active" : ""}`}
            onClick={() => setTab("requests")}
          >
            คำขอเบิก / ยืม
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "items" ? "active" : ""}`}
            onClick={() => setTab("items")}
          >
            คลังพัสดุ
          </button>
        </li>
      </ul>

      <div className="card mis-card">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder={
                  tab === "requests"
                    ? "ค้นหาเลขที่คำขอ / ชื่อพัสดุ / ผู้ขอ"
                    : "ค้นหารหัส / ชื่อพัสดุ / หมวดหมู่"
                }
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            {tab === "requests" ? (
              <div className="col-12 col-md-3">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">ทุกสถานะ</option>
                  {["pending", "approved", "returned", "rejected", "cancelled"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    )
                  )}
                </select>
              </div>
            ) : null}
          </div>

          {loading ? (
            <p className="text-secondary mb-0">กำลังโหลดข้อมูล...</p>
          ) : tab === "requests" ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>เลขที่</th>
                    <th>ประเภท</th>
                    <th>พัสดุ</th>
                    <th className="text-end">จำนวน</th>
                    <th>ผู้ขอ</th>
                    <th>วันที่ขอ</th>
                    <th>กำหนดคืน</th>
                    <th>สถานะ</th>
                    <th className="text-end">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-secondary py-4">
                        ไม่พบคำขอตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    visibleRequests.map((r) => {
                      const overdue =
                        r.kind === "borrow" &&
                        r.status === "approved" &&
                        r.dueDate &&
                        r.dueDate < today;
                      return (
                        <tr key={r.id}>
                          <td className="fw-semibold">{r.code}</td>
                          <td>
                            <span
                              className={`badge ${r.kind === "borrow" ? "text-bg-info" : "text-bg-light"}`}
                            >
                              {SUPPLY_KIND_LABELS[r.kind]}
                            </span>
                          </td>
                          <td>
                            <div>{r.itemName}</div>
                            <div className="small text-secondary">{r.itemCode}</div>
                          </td>
                          <td className="text-end">
                            {r.qty} {r.itemUnit}
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
                              {isOfficer &&
                              r.kind === "borrow" &&
                              r.status === "approved" ? (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => act(r, "return")}
                                >
                                  รับคืน
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
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle table-nowrap">
                <thead className="table-light">
                  <tr>
                    <th>รหัส</th>
                    <th>ชื่อพัสดุ</th>
                    <th>ประเภท</th>
                    <th>หมวดหมู่</th>
                    <th className="text-end">คงเหลือ</th>
                    <th>ที่เก็บ</th>
                    {isOfficer ? <th className="text-end">จัดการ</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.length === 0 ? (
                    <tr>
                      <td colSpan={isOfficer ? 7 : 6} className="text-center text-secondary py-4">
                        ไม่พบพัสดุตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    visibleItems.map((i) => (
                      <tr key={i.id}>
                        <td className="fw-semibold">{i.code}</td>
                        <td>{i.name}</td>
                        <td>
                          <span className="badge text-bg-light">
                            {ITEM_TYPE_LABELS[i.type]}
                          </span>
                        </td>
                        <td>{i.category}</td>
                        <td
                          className={`text-end fw-semibold ${
                            i.qty === 0 ? "text-danger" : i.qty <= 10 ? "text-warning" : ""
                          }`}
                        >
                          {i.qty} {i.unit}
                        </td>
                        <td>{i.location || "-"}</td>
                        {isOfficer ? (
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  setItemForm(i);
                                  setFormError("");
                                }}
                              >
                                แก้ไข
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => removeItem(i)}
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={requestForm !== null}
        onClose={() => setRequestForm(null)}
        title="สร้างคำขอเบิก / ยืมพัสดุ"
        footer={
          <>
            <button className="btn btn-light" onClick={() => setRequestForm(null)}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="supply-request-form"
              disabled={saving}
            >
              {saving ? "กำลังส่ง..." : "ส่งคำขอ"}
            </button>
          </>
        }
      >
        {requestForm ? (
          <form id="supply-request-form" onSubmit={submitRequest}>
            {formError ? <div className="alert alert-danger py-2">{formError}</div> : null}

            <div className="mb-3">
              <label className="form-label">ประเภทคำขอ</label>
              <select
                className="form-select"
                value={requestForm.kind}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, kind: e.target.value })
                }
              >
                <option value="issue">เบิก (ไม่ต้องคืน)</option>
                <option value="borrow">ยืม (ต้องคืนตามกำหนด)</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">พัสดุ</label>
              <select
                className="form-select"
                value={requestForm.itemId}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, itemId: e.target.value })
                }
                required
              >
                <option value="">-- เลือกพัสดุ --</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id} disabled={i.qty === 0}>
                    {i.code} — {i.name} (คงเหลือ {i.qty} {i.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">จำนวน</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={requestForm.qty}
                onChange={(e) => setRequestForm({ ...requestForm, qty: e.target.value })}
                required
              />
            </div>

            {requestForm.kind === "borrow" ? (
              <div className="mb-3">
                <label className="form-label">กำหนดคืน</label>
                <input
                  type="date"
                  className="form-control"
                  value={requestForm.dueDate}
                  min={today}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, dueDate: e.target.value })
                  }
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="form-label">วัตถุประสงค์</label>
              <textarea
                className="form-control"
                rows={3}
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

      <Modal
        open={itemForm !== null}
        onClose={() => setItemForm(null)}
        title={itemForm?.id ? `แก้ไขพัสดุ: ${itemForm.name}` : "เพิ่มพัสดุใหม่"}
        footer={
          <>
            <button className="btn btn-light" onClick={() => setItemForm(null)}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              form="supply-item-form"
              disabled={saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </>
        }
      >
        {itemForm ? (
          <form id="supply-item-form" onSubmit={submitItem}>
            {formError ? <div className="alert alert-danger py-2">{formError}</div> : null}

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label">รหัสพัสดุ</label>
                <input
                  className="form-control"
                  value={itemForm.code}
                  onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                  disabled={Boolean(itemForm.id)}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">ประเภท</label>
                <select
                  className="form-select"
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
              <div className="col-12">
                <label className="form-label">ชื่อพัสดุ</label>
                <input
                  className="form-control"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label">หมวดหมู่</label>
                <input
                  className="form-control"
                  value={itemForm.category}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, category: e.target.value })
                  }
                />
              </div>
              <div className="col-3">
                <label className="form-label">หน่วยนับ</label>
                <input
                  className="form-control"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                />
              </div>
              <div className="col-3">
                <label className="form-label">คงเหลือ</label>
                <input
                  type="number"
                  min={0}
                  className="form-control"
                  value={itemForm.qty}
                  onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })}
                  required
                />
              </div>
              <div className="col-12">
                <label className="form-label">สถานที่จัดเก็บ</label>
                <input
                  className="form-control"
                  value={itemForm.location}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, location: e.target.value })
                  }
                />
              </div>
            </div>
          </form>
        ) : null}
      </Modal>
    </>
  );
}
