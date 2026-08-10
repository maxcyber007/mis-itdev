import crypto from "crypto";
import { read, update, nextCode } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

function decorate(db, r) {
  const requester = db.users.find((u) => u.id === r.userId);
  const approver = db.users.find((u) => u.id === r.approvedBy);
  return {
    ...r,
    requesterName: requester ? requester.name : "(ถูกลบแล้ว)",
    approverName: approver ? approver.name : null,
  };
}

export async function GET(request) {
  const { user, error } = requireUser();
  if (error) return error;

  const status = new URL(request.url).searchParams.get("status");
  const db = read();
  let requests = db.financeRequests;
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

  const record = await update((db) => {
    const r = {
      id: crypto.randomUUID(),
      code: nextCode(db, "finance"),
      userId: user.id,
      kind,
      title,
      category: String(body.category || "ทั่วไป").trim(),
      amount: Math.round(amount * 100) / 100,
      dueDate: kind === "advance" ? String(body.dueDate) : null,
      status: "pending",
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      paidAt: null,
      settledAmount: null,
      settledAt: null,
      note: "",
    };
    db.financeRequests.push(r);
    return r;
  });

  return json({ request: decorate(read(), record) }, 201);
}
