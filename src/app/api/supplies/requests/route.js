import crypto from "crypto";
import { read, update, nextCode } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

/** ผสมชื่อผู้ขอและชื่อพัสดุเข้ากับคำขอ เพื่อให้หน้าจอแสดงผลได้ในคำขอเดียว */
function decorate(db, r) {
  const item = db.supplyItems.find((i) => i.id === r.itemId);
  const requester = db.users.find((u) => u.id === r.userId);
  const approver = db.users.find((u) => u.id === r.approvedBy);
  return {
    ...r,
    itemName: item ? item.name : "(ถูกลบแล้ว)",
    itemCode: item ? item.code : "-",
    itemUnit: item ? item.unit : "",
    requesterName: requester ? requester.name : "(ถูกลบแล้ว)",
    approverName: approver ? approver.name : null,
  };
}

export async function GET(request) {
  const { user, error } = requireUser();
  if (error) return error;

  const status = new URL(request.url).searchParams.get("status");
  const db = read();
  let requests = db.supplyRequests;
  if (user.role === "user") requests = requests.filter((r) => r.userId === user.id);
  if (status) requests = requests.filter((r) => r.status === status);

  return json({
    requests: requests
      .map((r) => decorate(db, r))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
  });
}

export async function POST(request) {
  const { user, error } = requireUser();
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

  const result = await update((db) => {
    const item = db.supplyItems.find((i) => i.id === itemId);
    if (!item) return { notFound: true };
    if (qty > item.qty) return { insufficient: item.qty };

    const record = {
      id: crypto.randomUUID(),
      code: nextCode(db, "supply"),
      userId: user.id,
      itemId,
      qty,
      kind,
      purpose: String(body.purpose || "").trim(),
      dueDate: kind === "borrow" ? String(body.dueDate) : null,
      status: "pending",
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      returnedAt: null,
      note: "",
    };
    db.supplyRequests.push(record);
    return { record };
  });

  if (result.notFound) return json({ message: "ไม่พบรายการพัสดุ" }, 404);
  if (result.insufficient !== undefined) {
    return json({ message: `พัสดุคงเหลือไม่พอ (คงเหลือ ${result.insufficient})` }, 400);
  }
  return json({ request: decorate(read(), result.record) }, 201);
}
