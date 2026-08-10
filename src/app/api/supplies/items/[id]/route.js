import { update } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  const { error } = requireUser(["admin", "staff"]);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  if (body.qty !== undefined) {
    const qty = Number(body.qty);
    if (!Number.isInteger(qty) || qty < 0) {
      return json({ message: "จำนวนคงเหลือต้องเป็นจำนวนเต็มไม่ติดลบ" }, 400);
    }
  }

  const result = await update((db) => {
    const item = db.supplyItems.find((i) => i.id === params.id);
    if (!item) return { notFound: true };

    for (const key of ["name", "category", "unit", "location"]) {
      if (body[key] !== undefined) item[key] = String(body[key]).trim();
    }
    if (body.qty !== undefined) item.qty = Number(body.qty);
    if (body.type !== undefined) {
      item.type = body.type === "durable" ? "durable" : "consumable";
    }
    return { item };
  });

  if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
  return json({ item: result.item });
}

export async function DELETE(_request, { params }) {
  const { error } = requireUser(["admin", "staff"]);
  if (error) return error;

  const result = await update((db) => {
    const index = db.supplyItems.findIndex((i) => i.id === params.id);
    if (index === -1) return { notFound: true };

    const inUse = db.supplyRequests.some(
      (r) => r.itemId === params.id && ["pending", "approved"].includes(r.status)
    );
    if (inUse) return { inUse: true };

    db.supplyItems.splice(index, 1);
    return { deleted: true };
  });

  if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
  if (result.inUse) {
    return json({ message: "พัสดุนี้มีคำขอที่ยังไม่ปิดรายการอยู่" }, 409);
  }
  return json({ ok: true });
}
