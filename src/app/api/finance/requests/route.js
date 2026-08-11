import { createFinanceRequest, listFinanceRequests } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    const status = new URL(request.url).searchParams.get("status");
    const requests = await listFinanceRequests({
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
    const title = String(body.title || "").trim();
    const amount = Number(body.amount);
    const kind = body.kind === "advance" ? "advance" : "reimburse";

    if (!title) return json({ message: "กรุณากรอกรายการที่ขอเบิก" }, 400);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ message: "จำนวนเงินต้องมากกว่า 0" }, 400);
    }
    if (kind === "advance" && !body.dueDate) {
      return json({ message: "กรุณาระบุกำหนดคืนเงินยืม" }, 400);
    }

    const result = await createFinanceRequest({
      userId: user.id,
      kind,
      title,
      category: String(body.category || "ทั่วไป").trim(),
      amount: Math.round(amount * 100) / 100,
      dueDate: body.dueDate ? String(body.dueDate) : null,
    });

    return json({ request: result.record }, 201);
  } catch (error) {
    return dbError(error);
  }
}
