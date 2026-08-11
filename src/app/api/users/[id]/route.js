import { hashPassword, ROLES } from "@/lib/auth";
import { deleteUser, publicUser, updateUser } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const { user: actor, error } = await requireUser(["admin"]);
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

    const changes = {};
    if (body.name !== undefined) changes.name = String(body.name).trim();
    if (body.email !== undefined) changes.email = String(body.email).trim();
    if (body.role !== undefined) changes.role = body.role;
    if (body.active !== undefined) changes.active = Boolean(body.active);
    if (body.password) changes.password = String(body.password);

    const result = await updateUser(id, changes, hashPassword);
    if (result.notFound) return json({ message: "ไม่พบผู้ใช้" }, 404);

    return json({ user: publicUser(result.user) });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user: actor, error } = await requireUser(["admin"]);
    if (error) return error;

    const { id } = params;
    if (id === actor.id) {
      return json({ message: "ไม่สามารถลบบัญชีของตนเองได้" }, 400);
    }

    const result = await deleteUser(id);
    if (result.notFound) return json({ message: "ไม่พบผู้ใช้" }, 404);
    if (result.disabled) {
      return json({
        ok: true,
        message: "ผู้ใช้มีประวัติรายการอยู่ จึงระงับการใช้งานแทนการลบ",
      });
    }
    return json({ ok: true, message: "ลบผู้ใช้เรียบร้อย" });
  } catch (error) {
    return dbError(error);
  }
}
