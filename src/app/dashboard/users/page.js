"use client";

import { useCallback, useEffect, useState } from "react";
import ActionDialog from "@/components/ActionDialog";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import { EmptyState, PageHeader, SearchInput, TableSkeleton } from "@/components/ui";
import {
  IconPencil,
  IconPlus,
  IconPower,
  IconSpinner,
  IconTrash,
  IconUsers,
} from "@/components/Icons";
import { api } from "@/lib/client";
import { ROLE_LABELS, formatDate } from "@/lib/labels";

const EMPTY_FORM = {
  username: "",
  name: "",
  email: "",
  role: "user",
  password: "",
};

const ROLE_TONE = {
  admin: "bg-violet-50 text-violet-700 ring-violet-600/20",
  staff: "bg-sky-50 text-sky-700 ring-sky-600/20",
  user: "bg-ink-100 text-ink-600 ring-ink-500/15",
};

function Avatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-semibold text-white">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // null = ปิด, {} = เพิ่มใหม่
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [dialog, setDialog] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ users: list }, { user }] = await Promise.all([
        api("/api/users"),
        api("/api/auth/me"),
      ]);
      setUsers(list);
      setMe(user);
    } catch (e) {
      setToast({ type: "error", message: e.message });
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
        const body = { name: form.name, email: form.email, role: form.role };
        if (form.password) body.password = form.password;
        await api(`/api/users/${editing.id}`, { method: "PATCH", body });
        setToast({ type: "success", message: `บันทึกข้อมูลผู้ใช้ ${form.username} เรียบร้อย` });
      } else {
        await api("/api/users", { method: "POST", body: form });
        setToast({ type: "success", message: `เพิ่มผู้ใช้ ${form.username} เรียบร้อย` });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function confirmToggle(user) {
    setDialog({
      title: user.active ? "ระงับการใช้งานบัญชี" : "เปิดใช้งานบัญชี",
      message: `ยืนยัน${user.active ? "ระงับ" : "เปิด"}การใช้งานบัญชี "${user.username}"? ${
        user.active ? "ผู้ใช้จะเข้าสู่ระบบไม่ได้จนกว่าจะเปิดใช้งานอีกครั้ง" : ""
      }`,
      tone: user.active ? "amber" : "emerald",
      confirmLabel: user.active ? "ระงับการใช้งาน" : "เปิดใช้งาน",
      icon: IconPower,
      run: async () => {
        await api(`/api/users/${user.id}`, {
          method: "PATCH",
          body: { active: !user.active },
        });
        return `${user.active ? "ระงับ" : "เปิด"}การใช้งานบัญชี ${user.username} เรียบร้อย`;
      },
    });
  }

  function confirmRemove(user) {
    setDialog({
      title: "ลบผู้ใช้",
      message: `ยืนยันลบผู้ใช้ "${user.username}"? หากผู้ใช้มีประวัติคำขออยู่ ระบบจะระงับการใช้งานแทนการลบเพื่อรักษาข้อมูลอ้างอิง`,
      tone: "rose",
      confirmLabel: "ลบผู้ใช้",
      icon: IconTrash,
      run: async () => {
        const res = await api(`/api/users/${user.id}`, { method: "DELETE" });
        return res.message || "ลบผู้ใช้เรียบร้อย";
      },
    });
  }

  async function runDialog() {
    const message = await dialog.run();
    setDialog(null);
    setToast({ type: "success", message });
    await load();
  }

  const filtered = users.filter((u) => {
    const matchRole = !roleFilter || u.role === roleFilter;
    const text = `${u.username} ${u.name} ${u.email || ""}`.toLowerCase();
    return matchRole && text.includes(keyword.toLowerCase());
  });

  return (
    <>
      <Toast {...(toast || {})} onClose={() => setToast(null)} />

      <PageHeader
        title="จัดการผู้ใช้"
        subtitle="กำหนดสิทธิ์การใช้งาน 3 ระดับ: ผู้ดูแลระบบ · เจ้าหน้าที่ · ผู้ใช้ทั่วไป"
      >
        <button className="btn-primary" onClick={openCreate}>
          <IconPlus className="h-4 w-4" />
          เพิ่มผู้ใช้
        </button>
      </PageHeader>

      <div className="card animate-fade-up overflow-hidden stagger-1">
        <div className="grid gap-3 border-b border-ink-100 p-4 sm:grid-cols-[1fr_auto]">
          <SearchInput
            value={keyword}
            onChange={setKeyword}
            placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ-สกุล / อีเมล"
          />
          <select
            className="select sm:w-52"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">ทุกสิทธิ์การใช้งาน</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="ไม่พบผู้ใช้ตามเงื่อนไข"
            description="ลองปรับคำค้นหรือเปลี่ยนตัวกรองสิทธิ์การใช้งาน"
            icon={IconUsers}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ผู้ใช้</th>
                  <th>อีเมล</th>
                  <th>สิทธิ์</th>
                  <th>สถานะ</th>
                  <th>สร้างเมื่อ</th>
                  <th className="col-sticky">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const self = Boolean(me && u.id === me.id);
                  return (
                    <tr key={u.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium text-ink-900">
                              {u.name}
                              {self ? (
                                <span className="badge bg-brand-50 text-brand-700 ring-brand-600/20">
                                  คุณ
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-ink-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate text-ink-600">{u.email || "—"}</td>
                      <td>
                        <span className={`badge ${ROLE_TONE[u.role] || ROLE_TONE.user}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.active
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-ink-100 text-ink-500 ring-ink-500/15"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.active ? "bg-emerald-500" : "bg-ink-400"
                            }`}
                          />
                          {u.active ? "ใช้งาน" : "ระงับ"}
                        </span>
                      </td>
                      <td className="text-xs text-ink-500">{formatDate(u.createdAt)}</td>
                      <td className="col-sticky">
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-chip text-ink-600 hover:bg-ink-100"
                            onClick={() => openEdit(u)}
                            title="แก้ไข"
                          >
                            <IconPencil className="h-3.5 w-3.5" />
                            แก้ไข
                          </button>
                          <button
                            className="btn-chip text-amber-700 hover:bg-amber-50"
                            onClick={() => confirmToggle(u)}
                            disabled={self}
                            title={u.active ? "ระงับการใช้งาน" : "เปิดใช้งาน"}
                          >
                            <IconPower className="h-3.5 w-3.5" />
                            {u.active ? "ระงับ" : "เปิดใช้"}
                          </button>
                          <button
                            className="btn-chip text-rose-600 hover:bg-rose-50"
                            onClick={() => confirmRemove(u)}
                            disabled={self}
                            title="ลบผู้ใช้"
                          >
                            <IconTrash className="h-3.5 w-3.5" />
                          </button>
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
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้ใหม่"}
        description={
          editing?.id
            ? `กำลังแก้ไขบัญชี @${editing.username}`
            : "กำหนดชื่อผู้ใช้ รหัสผ่าน และสิทธิ์การใช้งาน"
        }
        footer={
          <>
            <button className="btn-ghost" onClick={() => setEditing(null)}>
              ยกเลิก
            </button>
            <button className="btn-primary" form="user-form" type="submit" disabled={saving}>
              {saving ? <IconSpinner /> : null}
              บันทึก
            </button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSave} className="space-y-4">
          {formError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">ชื่อผู้ใช้</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={Boolean(editing?.id)}
                placeholder="เช่น teacher01"
                required
              />
            </div>
            <div>
              <label className="label">สิทธิ์การใช้งาน</label>
              <select
                className="select"
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
          </div>

          <div>
            <label className="label">ชื่อ-สกุล</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="เช่น นายสมชาย ใจดี"
              required
            />
          </div>

          <div>
            <label className="label">อีเมล</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@cmtc.ac.th"
            />
          </div>

          <div>
            <label className="label">
              รหัสผ่าน
              {editing?.id ? (
                <span className="font-normal text-ink-400"> (เว้นว่างหากไม่เปลี่ยน)</span>
              ) : null}
            </label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required={!editing?.id}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </div>
        </form>
      </Modal>

      <ActionDialog config={dialog} onConfirm={runDialog} onClose={() => setDialog(null)} />
    </>
  );
}
