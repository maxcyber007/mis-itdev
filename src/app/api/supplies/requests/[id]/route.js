import { actOnSupplyRequest } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const ACTIONS = ["approve", "reject", "return", "cancel"];

/**
 * ดำเนินการกับคำขอพัสดุ
 * approve/reject/return : เจ้าหน้าที่และผู้ดูแลระบบ
 * cancel                : เจ้าของคำขอ ขณะที่ยังรออนุมัติ
 */
export async function PATCH(request, { params }) {
  try {
    const { user, error } = await requireUser();
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

    const result = await actOnSupplyRequest({
      id: params.id,
      action,
      actor: user,
      note: String(body.note || "").trim(),
    });

    if (result.notFound) return json({ message: "ไม่พบคำขอ" }, 404);
    if (result.forbidden) return json({ message: "ไม่มีสิทธิ์ดำเนินการนี้" }, 403);
    if (result.invalid) return json({ message: result.invalid }, 400);
    return json({ request: result.record });
  } catch (error) {
    return dbError(error);
  }
}
