import { update } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACTIONS = ["approve", "reject", "return", "cancel"];

/**
 * ดำเนินการกับคำขอพัสดุ
 * approve/reject/return : เจ้าหน้าที่และผู้ดูแลระบบ
 * cancel                : เจ้าของคำขอ ขณะที่ยังรออนุมัติ
 */
export async function PATCH(request, { params }) {
  const { user, error } = requireUser();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "");
  if (!ACTIONS.includes(action)) {
    return json({ message: "คำสั่งไม่ถูกต้อง" }, 400);
  }

  const isOfficer = user.role === "admin" || user.role === "staff";
  if (action !== "cancel" && !isOfficer) {
    return json({ message: "ไม่มีสิทธิ์ดำเนินการนี้" }, 403);
  }

  const result = await update((db) => {
    const record = db.supplyRequests.find((r) => r.id === params.id);
    if (!record) return { notFound: true };
    const item = db.supplyItems.find((i) => i.id === record.itemId);
    const now = new Date().toISOString();

    if (action === "cancel") {
      if (record.userId !== user.id && !isOfficer) return { forbidden: true };
      if (record.status !== "pending") return { invalid: "ยกเลิกได้เฉพาะคำขอที่รออนุมัติ" };
      record.status = "cancelled";
      record.note = String(body.note || "").trim();
      return { record };
    }

    if (action === "approve") {
      if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
      if (!item) return { invalid: "ไม่พบพัสดุของคำขอนี้" };
      if (record.qty > item.qty) {
        return { invalid: `พัสดุคงเหลือไม่พอ (คงเหลือ ${item.qty})` };
      }
      item.qty -= record.qty;
      record.status = "approved";
      record.approvedBy = user.id;
      record.approvedAt = now;
      record.note = String(body.note || "").trim();
      return { record };
    }

    if (action === "reject") {
      if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
      record.status = "rejected";
      record.approvedBy = user.id;
      record.approvedAt = now;
      record.note = String(body.note || "").trim();
      return { record };
    }

    // action === "return"
    if (record.kind !== "borrow") return { invalid: "รายการนี้ไม่ใช่การยืม" };
    if (record.status !== "approved") return { invalid: "คืนได้เฉพาะรายการที่อนุมัติแล้ว" };
    if (item) item.qty += record.qty;
    record.status = "returned";
    record.returnedAt = now;
    if (body.note) record.note = String(body.note).trim();
    return { record };
  });

  if (result.notFound) return json({ message: "ไม่พบคำขอ" }, 404);
  if (result.forbidden) return json({ message: "ไม่มีสิทธิ์ดำเนินการนี้" }, 403);
  if (result.invalid) return json({ message: result.invalid }, 400);
  return json({ request: result.record });
}
