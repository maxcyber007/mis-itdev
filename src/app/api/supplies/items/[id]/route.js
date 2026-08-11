import { deleteItem, updateItem } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const { error } = await requireUser(["admin", "staff"]);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const changes = {};

    for (const key of ["name", "category", "unit", "location"]) {
      if (body[key] !== undefined) changes[key] = String(body[key]).trim();
    }
    if (body.qty !== undefined) {
      const qty = Number(body.qty);
      if (!Number.isInteger(qty) || qty < 0) {
        return json({ message: "จำนวนคงเหลือต้องเป็นจำนวนเต็มไม่ติดลบ" }, 400);
      }
      changes.qty = qty;
    }
    if (body.type !== undefined) {
      changes.type = body.type === "durable" ? "durable" : "consumable";
    }

    const result = await updateItem(params.id, changes);
    if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
    return json({ item: result.item });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { error } = await requireUser(["admin", "staff"]);
    if (error) return error;

    const result = await deleteItem(params.id);
    if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
    if (result.inUse) {
      return json({ message: "พัสดุนี้มีคำขอที่ยังไม่ปิดรายการอยู่" }, 409);
    }
    return json({ ok: true });
  } catch (error) {
    return dbError(error);
  }
}
