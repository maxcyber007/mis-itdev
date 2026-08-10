import crypto from "crypto";
import { read, update } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = requireUser();
  if (error) return error;

  const items = read().supplyItems.sort((a, b) => a.code.localeCompare(b.code));
  return json({ items });
}

export async function POST(request) {
  const { error } = requireUser(["admin", "staff"]);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || "").trim();
  const name = String(body.name || "").trim();
  const qty = Number(body.qty);

  if (!code || !name) return json({ message: "กรุณากรอกรหัสและชื่อพัสดุ" }, 400);
  if (!Number.isInteger(qty) || qty < 0) {
    return json({ message: "จำนวนคงเหลือต้องเป็นจำนวนเต็มไม่ติดลบ" }, 400);
  }

  const result = await update((db) => {
    if (db.supplyItems.some((i) => i.code.toLowerCase() === code.toLowerCase())) {
      return { conflict: true };
    }
    const item = {
      id: crypto.randomUUID(),
      code,
      name,
      category: String(body.category || "ทั่วไป").trim(),
      unit: String(body.unit || "ชิ้น").trim(),
      qty,
      type: body.type === "durable" ? "durable" : "consumable",
      location: String(body.location || "").trim(),
      createdAt: new Date().toISOString(),
    };
    db.supplyItems.push(item);
    return { item };
  });

  if (result.conflict) return json({ message: "มีรหัสพัสดุนี้อยู่แล้ว" }, 409);
  return json({ item: result.item }, 201);
}
