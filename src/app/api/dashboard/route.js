import { read } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

const LOW_STOCK_THRESHOLD = 10;

export async function GET() {
  const { user, error } = requireUser();
  if (error) return error;

  const db = read();
  const scope = (list) =>
    user.role === "user" ? list.filter((r) => r.userId === user.id) : list;

  const supply = scope(db.supplyRequests);
  const finance = scope(db.financeRequests);
  const today = new Date().toISOString().slice(0, 10);

  const overdueBorrows = supply.filter(
    (r) => r.kind === "borrow" && r.status === "approved" && r.dueDate && r.dueDate < today
  );

  const byStatus = (list) =>
    list.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});

  const userName = (id) => db.users.find((u) => u.id === id)?.name ?? "(ถูกลบแล้ว)";
  const itemName = (id) => db.supplyItems.find((i) => i.id === id)?.name ?? "(ถูกลบแล้ว)";

  return json({
    role: user.role,
    supply: {
      total: supply.length,
      pending: supply.filter((r) => r.status === "pending").length,
      borrowed: supply.filter((r) => r.kind === "borrow" && r.status === "approved").length,
      overdue: overdueBorrows.length,
      byStatus: byStatus(supply),
    },
    finance: {
      total: finance.length,
      pending: finance.filter((r) => r.status === "pending").length,
      approvedAmount: finance
        .filter((r) => ["approved", "paid", "settled"].includes(r.status))
        .reduce((sum, r) => sum + r.amount, 0),
      paidAmount: finance
        .filter((r) => ["paid", "settled"].includes(r.status))
        .reduce((sum, r) => sum + r.amount, 0),
      outstandingAdvance: finance
        .filter((r) => r.kind === "advance" && r.status === "paid")
        .reduce((sum, r) => sum + r.amount, 0),
      byStatus: byStatus(finance),
    },
    stock: {
      items: db.supplyItems.length,
      lowStock: db.supplyItems
        .filter((i) => i.qty <= LOW_STOCK_THRESHOLD)
        .map((i) => ({ id: i.id, code: i.code, name: i.name, qty: i.qty, unit: i.unit }))
        .sort((a, b) => a.qty - b.qty),
    },
    users:
      user.role === "admin"
        ? {
            total: db.users.length,
            active: db.users.filter((u) => u.active).length,
            byRole: db.users.reduce(
              (acc, u) => ({ ...acc, [u.role]: (acc[u.role] || 0) + 1 }),
              {}
            ),
          }
        : null,
    recent: {
      supply: supply
        .slice()
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          code: r.code,
          kind: r.kind,
          status: r.status,
          qty: r.qty,
          requestedAt: r.requestedAt,
          title: itemName(r.itemId),
          requesterName: userName(r.userId),
        })),
      finance: finance
        .slice()
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          code: r.code,
          kind: r.kind,
          status: r.status,
          amount: r.amount,
          requestedAt: r.requestedAt,
          title: r.title,
          requesterName: userName(r.userId),
        })),
    },
  });
}
