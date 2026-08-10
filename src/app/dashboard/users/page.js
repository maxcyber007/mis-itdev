"use client";

import { useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { api } from "@/lib/client";
import { ROLE_LABELS, formatDate } from "@/lib/labels";

const EMPTY_FORM = {
  username: "",
  name: "",
  email: "",
  role: "user",
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // null = ปิด, {} = เพิ่มใหม่
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ users: list }, { user }] = await Promise.all([
        api("/api/users"),
        api("/api/auth/me"),
      ]);
      setUsers(list);
      setMe(user);
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

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing({});
  }

  function openEdit(user) {
    setForm({
      username: user.username,
      name: user.name,
      email: user.email || "",
      role: user.role,
      password: "",
    });
    setFormError("");
    setEditing(user);
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing.id) {
        const body = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) body.password = form.password;
        await api(`/api/users/${editing.id}`, { method: "PATCH", body });
        setNotice(`บันทึกข้อมูลผู้ใช้ ${form.username} เรียบร้อย`);
      } else {
        await api("/api/users", { method: "POST", body: form });
        setNotice(`เพิ่มผู้ใช้ ${form.username} เรียบร้อย`);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    try {
      await api(`/api/users/${user.id}`, {
        method: "PATCH",
        body: { active: !user.active },
      });
      setNotice(
        `${user.active ? "ระงับ" : "เปิด"}การใช้งานบัญชี ${user.username} เรียบร้อย`
      );
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(user) {
    if (!window.confirm(`ยืนยันลบผู้ใช้ ${user.username}?`)) return;
    try {
      const res = await api(`/api/users/${user.id}`, { method: "DELETE" });
      setNotice(res.message || "ลบผู้ใช้เรียบร้อย");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const filtered = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const text = `${u.username} ${u.name} ${u.email || ""}`.toLowerCase();
    return matchRole && text.includes(keyword.toLowerCase());
  });

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">จัดการผู้ใช้</h1>
          <p className="text-secondary mb-0">
            กำหนดสิทธิ์การใช้งาน 3 ระดับ: ผู้ดูแลระบบ เจ้าหน้าที่ และผู้ใช้ทั่วไป
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          + เพิ่มผู้ใช้
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

      <div className="card mis-card">
        <div className="card-body">
          <div className="row g-2 mb-3">
            <div className="col-12 col-md-6">
              <input
                className="form-control"
                placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ-สกุล / อีเมล"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="col-12 col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">ทุกสิทธิ์</option>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                    <th>ชื่อผู้ใช้</th>
                    <th>ชื่อ-สกุล</th>
                    <th>อีเมล</th>
                    <th>สิทธิ์</th>
                    <th>สถานะ</th>
                    <th>สร้างเมื่อ</th>
                    <th className="text-end">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-secondary py-4">
                        ไม่พบผู้ใช้ตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id}>
                        <td className="fw-semibold">
                          {u.username}
                          {me && u.id === me.id ? (
                            <span className="badge text-bg-light ms-2">คุณ</span>
                          ) : null}
                        </td>
                        <td>{u.name}</td>
                        <td>{u.email || "-"}</td>
                        <td>
                          <span className="badge text-bg-secondary">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${u.active ? "text-bg-success" : "text-bg-secondary"}`}
                          >
                            {u.active ? "ใช้งาน" : "ระงับ"}
                          </span>
                        </td>
                        <td className="text-secondary small">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEdit(u)}
                            >
                              แก้ไข
                            </button>
                            <button
                              className="btn btn-outline-secondary"
                              onClick={() => toggleActive(u)}
                              disabled={Boolean(me && u.id === me.id)}
                            >
                              {u.active ? "ระงับ" : "เปิดใช้"}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => remove(u)}
                              disabled={Boolean(me && u.id === me.id)}
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
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
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `แก้ไขผู้ใช้: ${editing.username}` : "เพิ่มผู้ใช้ใหม่"}
        footer={
          <>
            <button className="btn btn-light" onClick={() => setEditing(null)}>
              ยกเลิก
            </button>
            <button
              className="btn btn-primary"
              form="user-form"
              type="submit"
              disabled={saving}
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave}>
          {formError ? <div className="alert alert-danger py-2">{formError}</div> : null}

          <div className="mb-3">
            <label className="form-label">ชื่อผู้ใช้</label>
            <input
              className="form-control"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              disabled={Boolean(editing?.id)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">ชื่อ-สกุล</label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">อีเมล</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">สิทธิ์การใช้งาน</label>
            <select
              className="form-select"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">
              รหัสผ่าน
              {editing?.id ? (
                <span className="text-secondary small"> (เว้นว่างหากไม่เปลี่ยน)</span>
              ) : null}
            </label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required={!editing?.id}
            />
            <div className="form-text">อย่างน้อย 8 ตัวอักษร</div>
          </div>
        </form>
      </Modal>
    </>
  );
}
