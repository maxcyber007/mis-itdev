import { createSupplyRequest, listSupplyRequests } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const status = new URL(request.url).searchParams.get("status");
    const requests = await listSupplyRequests({
      userId: user.role === "user" ? user.id : undefined,
      status,
    });
    return json({ requests });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const body = await request.json().catch(() => ({}));
    const itemId = String(body.itemId || "");
    const qty = Number(body.qty);
    const kind = body.kind === "borrow" ? "borrow" : "issue";

    if (!itemId) return json({ message: "กรุณาเลือกพัสดุ" }, 400);
    if (!Number.isInteger(qty) || qty < 1) {
      return json({ message: "จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป" }, 400);
    }
    if (kind === "borrow" && !body.dueDate) {
      return json({ message: "กรุณาระบุกำหนดคืน" }, 400);
    }

    const result = await createSupplyRequest({
      userId: user.id,
      itemId,
      qty,
      kind,
      purpose: String(body.purpose || "").trim(),
      dueDate: body.dueDate ? String(body.dueDate) : null,
    });

    if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
    if (result.insufficient !== undefined) {
      return json(
        { message: `พัสดุคงเหลือไม่พอ (คงเหลือ ${result.insufficient})` },
        400
      );
    }
    return json({ request: result.record }, 201);
  } catch (error) {
    return dbError(error);
  }
}
