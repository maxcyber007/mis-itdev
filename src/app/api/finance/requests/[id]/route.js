import { update } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACTIONS = ["approve", "reject", "pay", "settle", "cancel"];

/**
 * ดำเนินการกับคำขอทางการเงิน
 * approve/reject/pay/settle : เจ้าหน้าที่และผู้ดูแลระบบ
 * cancel                    : เจ้าของคำขอ ขณะที่ยังรออนุมัติ
 */
export async function PATCH(request, { params }) {
  const { user, error } = requireUser();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!ACTIONS.includes(action)) return json({ message: "คำสั่งไม่ถูกต้อง" }, 400);

  const isOfficer = user.role === "admin" || user.role === "staff";
  if (action !== "cancel" && !isOfficer) {
    return json({ message: "ไม่มีสิทธิ์ดำเนินการนี้" }, 403);
  }

  let settledAmount = null;
  if (action === "settle") {
    settledAmount = Number(body.settledAmount);
    if (!Number.isFinite(settledAmount) || settledAmount < 0) {
      return json({ message: "จำนวนเงินที่คืน/ใช้จริงไม่ถูกต้อง" }, 400);
    }
  }

  const result = await update((db) => {
    const record = db.financeRequests.find((r) => r.id === params.id);
    if (!record) return { notFound: true };
    const now = new Date().toISOString();

    switch (action) {
      case "cancel":
        if (record.userId !== user.id && !isOfficer) return { forbidden: true };
        if (record.status !== "pending") {
          return { invalid: "ยกเลิกได้เฉพาะคำขอที่รออนุมัติ" };
        }
        record.status = "cancelled";
        break;

      case "approve":
        if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
        record.status = "approved";
        record.approvedBy = user.id;
        record.approvedAt = now;
        break;

      case "reject":
        if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
        record.status = "rejected";
        record.approvedBy = user.id;
        record.approvedAt = now;
        break;

      case "pay":
        if (record.status !== "approved") return { invalid: "จ่ายเงินได้เฉพาะรายการที่อนุมัติแล้ว" };
        record.status = "paid";
        record.paidAt = now;
        break;

      case "settle":
        if (record.kind !== "advance") return { invalid: "รายการนี้ไม่ใช่เงินยืม" };
        if (record.status !== "paid") return { invalid: "ล้างหนี้ได้เฉพาะรายการที่จ่ายเงินแล้ว" };
        record.status = "settled";
        record.settledAmount = Math.round(settledAmount * 100) / 100;
        record.settledAt = now;
        break;
    }

    if (body.note !== undefined) record.note = String(body.note).trim();
    return { record };
  });

  if (result.notFound) return json({ message: "ไม่พบคำขอ" }, 404);
  if (result.forbidden) return json({ message: "ไม่มีสิทธิ์ดำเนินการนี้" }, 403);
  if (result.invalid) return json({ message: result.invalid }, 400);
  return json({ request: result.record });
}
