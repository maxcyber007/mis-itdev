import { createItem, listItems } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireUser();
    if (error) return error;

    return json({ items: await listItems() });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request) {
  try {
    const { error } = await requireUser(["admin", "staff"]);
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    const name = String(body.name || "").trim();
    const qty = Number(body.qty);

    if (!code || !name) return json({ message: "กรุณากรอกรหัสและชื่อพัสดุ" }, 400);
    if (!Number.isInteger(qty) || qty < 0) {
      return json({ message: "จำนวนคงเหลือต้องเป็นจำนวนเต็มไม่ติดลบ" }, 400);
    }

    const result = await createItem({
      code,
      name,
      category: String(body.category || "ทั่วไป").trim(),
      unit: String(body.unit || "ชิ้น").trim(),
      qty,
      type: body.type === "durable" ? "durable" : "consumable",
      location: String(body.location || "").trim(),
    });

    if (result.conflict) return json({ message: "มีรหัสพัสดุนี้อยู่แล้ว" }, 409);
    return json({ item: result.item }, 201);
  } catch (error) {
    return dbError(error);
  }
}
