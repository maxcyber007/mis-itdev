import { hashPassword, ROLES } from "@/lib/auth";
import { update, publicUser } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const { user: actor, error } = requireUser(["admin"]);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const { id } = params;

  if (body.role && !Object.keys(ROLES).includes(body.role)) {
    return json({ message: "สิทธิ์การใช้งานไม่ถูกต้อง" }, 400);
  }
  if (body.password !== undefined && String(body.password).length < 8) {
    return json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, 400);
  }
  const selfDemote = id === actor.id && body.role && body.role !== "admin";
  const selfDisable = id === actor.id && body.active === false;
  if (selfDemote || selfDisable) {
    return json({ message: "ไม่สามารถลดสิทธิ์หรือระงับบัญชีของตนเองได้" }, 400);
  }

  const result = await update((db) => {
    const target = db.users.find((u) => u.id === id);
    if (!target) return { notFound: true };

    if (body.name !== undefined) target.name = String(body.name).trim();
    if (body.email !== undefined) target.email = String(body.email).trim();
    if (body.role !== undefined) target.role = body.role;
    if (body.active !== undefined) target.active = Boolean(body.active);
    if (body.password) {
      const { salt, hash } = hashPassword(String(body.password));
      target.salt = salt;
      target.hash = hash;
    }
    return { user: target };
  });

  if (result.notFound) return json({ message: "ไม่พบผู้ใช้" }, 404);
  return json({ user: publicUser(result.user) });
}

export async function DELETE(_request, { params }) {
  const { user: actor, error } = requireUser(["admin"]);
  if (error) return error;

  const { id } = params;
  if (id === actor.id) {
    return json({ message: "ไม่สามารถลบบัญชีของตนเองได้" }, 400);
  }

  const result = await update((db) => {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return { notFound: true };
    const hasHistory =
      db.supplyRequests.some((r) => r.userId === id) ||
      db.financeRequests.some((r) => r.userId === id);
    if (hasHistory) {
      // มีประวัติรายการอยู่ ให้ระงับการใช้งานแทนการลบ เพื่อรักษาข้อมูลอ้างอิง
      db.users[index].active = false;
      return { disabled: true };
    }
    db.users.splice(index, 1);
    return { deleted: true };
  });

  if (result.notFound) return json({ message: "ไม่พบผู้ใช้" }, 404);
  if (result.disabled) {
    return json({
      ok: true,
      message: "ผู้ใช้มีประวัติรายการอยู่ จึงระงับการใช้งานแทนการลบ",
    });
  }
  return json({ ok: true, message: "ลบผู้ใช้เรียบร้อย" });
}
