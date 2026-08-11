import crypto from "crypto";
import { execute, nextCode, query, queryOne, transaction } from "./db";

/**
 * ชั้นเข้าถึงข้อมูลของระบบ MIS (MySQL / MariaDB)
 * ทุกฟังก์ชันคืนค่าเป็น object แบบ camelCase เพื่อให้ API และหน้าจอใช้ได้ทันที
 */

const iso = (value) => (value ? new Date(value).toISOString() : null);
const money = (value) => (value === null || value === undefined ? null : Number(value));

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    salt: row.salt,
    hash: row.hash,
    name: row.name,
    role: row.role,
    email: row.email,
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
  };
}

export function publicUser(user) {
  if (!user) return null;
  const { salt, hash, ...rest } = user;
  return rest;
}

function mapItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    unit: row.unit,
    qty: row.qty,
    type: row.type,
    location: row.location,
    createdAt: iso(row.created_at),
  };
}

function mapSupplyRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    itemId: row.item_id,
    qty: row.qty,
    kind: row.kind,
    purpose: row.purpose || "",
    dueDate: row.due_date || null,
    status: row.status,
    requestedAt: iso(row.requested_at),
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    returnedAt: iso(row.returned_at),
    note: row.note || "",
    itemName: row.item_name ?? undefined,
    itemCode: row.item_code ?? undefined,
    itemUnit: row.item_unit ?? undefined,
    requesterName: row.requester_name ?? undefined,
    approverName: row.approver_name ?? null,
  };
}

function mapFinanceRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    kind: row.kind,
    title: row.title,
    category: row.category,
    amount: money(row.amount),
    dueDate: row.due_date || null,
    status: row.status,
    requestedAt: iso(row.requested_at),
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    paidAt: iso(row.paid_at),
    settledAmount: money(row.settled_amount),
    settledAt: iso(row.settled_at),
    note: row.note || "",
    requesterName: row.requester_name ?? undefined,
    approverName: row.approver_name ?? null,
  };
}

/* ------------------------------- ผู้ใช้งาน ------------------------------- */

export async function listUsers() {
  const rows = await query("SELECT * FROM users ORDER BY username");
  return rows.map(mapUser);
}

export async function findUserById(id) {
  return mapUser(await queryOne("SELECT * FROM users WHERE id = ?", [id]));
}

export async function findUserByUsername(username) {
  return mapUser(
    await queryOne("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", [username])
  );
}

export async function createUser({ username, password, name, role, email }, hashPassword) {
  const existing = await findUserByUsername(username);
  if (existing) return { conflict: true };

  const { salt, hash } = hashPassword(password);
  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO users (id, username, salt, hash, name, role, email, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
    [id, username, salt, hash, name, role, email]
  );
  return { user: await findUserById(id) };
}

export async function updateUser(id, changes, hashPassword) {
  const target = await findUserById(id);
  if (!target) return { notFound: true };

  const fields = [];
  const values = [];
  const set = (column, value) => {
    fields.push(`${column} = ?`);
    values.push(value);
  };

  if (changes.name !== undefined) set("name", changes.name);
  if (changes.email !== undefined) set("email", changes.email);
  if (changes.role !== undefined) set("role", changes.role);
  if (changes.active !== undefined) set("active", changes.active ? 1 : 0);
  if (changes.password) {
    const { salt, hash } = hashPassword(changes.password);
    set("salt", salt);
    set("hash", hash);
  }

  if (fields.length) {
    values.push(id);
    await execute(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
  }
  return { user: await findUserById(id) };
}

export async function deleteUser(id) {
  const target = await findUserById(id);
  if (!target) return { notFound: true };

  const history = await queryOne(
    `SELECT
       (SELECT COUNT(*) FROM supply_requests  WHERE user_id = ?) +
       (SELECT COUNT(*) FROM finance_requests WHERE user_id = ?) AS total`,
    [id, id]
  );

  // มีประวัติรายการอยู่ ให้ระงับการใช้งานแทนการลบ เพื่อรักษาข้อมูลอ้างอิง
  if (Number(history.total) > 0) {
    await execute("UPDATE users SET active = 0 WHERE id = ?", [id]);
    return { disabled: true };
  }

  await execute("DELETE FROM users WHERE id = ?", [id]);
  return { deleted: true };
}

/* -------------------------------- พัสดุ -------------------------------- */

export async function listItems() {
  const rows = await query("SELECT * FROM supply_items ORDER BY code");
  return rows.map(mapItem);
}

export async function findItemById(id) {
  return mapItem(await queryOne("SELECT * FROM supply_items WHERE id = ?", [id]));
}

export async function createItem(data) {
  const duplicate = await queryOne(
    "SELECT id FROM supply_items WHERE LOWER(code) = LOWER(?)",
    [data.code]
  );
  if (duplicate) return { conflict: true };

  const id = crypto.randomUUID();
  await execute(
    `INSERT INTO supply_items (id, code, name, category, unit, qty, type, location, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [id, data.code, data.name, data.category, data.unit, data.qty, data.type, data.location]
  );
  return { item: await findItemById(id) };
}

export async function updateItem(id, changes) {
  const target = await findItemById(id);
  if (!target) return { notFound: true };

  const fields = [];
  const values = [];
  for (const column of ["name", "category", "unit", "location", "qty", "type"]) {
    if (changes[column] !== undefined) {
      fields.push(`${column} = ?`);
      values.push(changes[column]);
    }
  }

  if (fields.length) {
    values.push(id);
    await execute(`UPDATE supply_items SET ${fields.join(", ")} WHERE id = ?`, values);
  }
  return { item: await findItemById(id) };
}

export async function deleteItem(id) {
  const target = await findItemById(id);
  if (!target) return { notFound: true };

  const open = await queryOne(
    `SELECT COUNT(*) AS total FROM supply_requests
     WHERE item_id = ? AND status IN ('pending', 'approved')`,
    [id]
  );
  if (Number(open.total) > 0) return { inUse: true };

  await execute("DELETE FROM supply_requests WHERE item_id = ?", [id]);
  await execute("DELETE FROM supply_items WHERE id = ?", [id]);
  return { deleted: true };
}

/* ---------------------------- คำขอพัสดุ ---------------------------- */

const SUPPLY_SELECT = `
  SELECT r.*,
         i.name  AS item_name,
         i.code  AS item_code,
         i.unit  AS item_unit,
         u.name  AS requester_name,
         a.name  AS approver_name
  FROM supply_requests r
  JOIN supply_items i ON i.id = r.item_id
  JOIN users u        ON u.id = r.user_id
  LEFT JOIN users a   ON a.id = r.approved_by`;

export async function listSupplyRequests({ userId, status } = {}) {
  const where = [];
  const params = [];
  if (userId) {
    where.push("r.user_id = ?");
    params.push(userId);
  }
  if (status) {
    where.push("r.status = ?");
    params.push(status);
  }

  const rows = await query(
    `${SUPPLY_SELECT}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY r.requested_at DESC`,
    params
  );
  return rows.map(mapSupplyRequest);
}

export async function findSupplyRequest(id) {
  return mapSupplyRequest(await queryOne(`${SUPPLY_SELECT} WHERE r.id = ?`, [id]));
}

export async function createSupplyRequest({ userId, itemId, qty, kind, purpose, dueDate }) {
  return transaction(async (conn) => {
    const [[item]] = await conn.query(
      "SELECT id, qty FROM supply_items WHERE id = ? FOR UPDATE",
      [itemId]
    );
    if (!item) return { notFound: true };
    if (qty > item.qty) return { insufficient: item.qty };

    const id = crypto.randomUUID();
    const code = await nextCode(conn, "supply");
    await conn.execute(
      `INSERT INTO supply_requests
         (id, code, user_id, item_id, qty, kind, purpose, due_date, status, requested_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), '')`,
      [id, code, userId, itemId, qty, kind, purpose, kind === "borrow" ? dueDate : null]
    );
    return { id };
  }).then(async (result) =>
    result.id ? { record: await findSupplyRequest(result.id) } : result
  );
}

/**
 * ดำเนินการกับคำขอพัสดุ
 * @param {"approve"|"reject"|"return"|"cancel"} action
 */
export async function actOnSupplyRequest({ id, action, actor, note }) {
  const outcome = await transaction(async (conn) => {
    const [[record]] = await conn.query(
      "SELECT * FROM supply_requests WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!record) return { notFound: true };

    const isOfficer = actor.role === "admin" || actor.role === "staff";

    if (action === "cancel") {
      if (record.user_id !== actor.id && !isOfficer) return { forbidden: true };
      if (record.status !== "pending") {
        return { invalid: "ยกเลิกได้เฉพาะคำขอที่รออนุมัติ" };
      }
      await conn.execute(
        "UPDATE supply_requests SET status = 'cancelled', note = ? WHERE id = ?",
        [note, id]
      );
      return { ok: true };
    }

    if (action === "approve") {
      if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };

      const [[item]] = await conn.query(
        "SELECT qty FROM supply_items WHERE id = ? FOR UPDATE",
        [record.item_id]
      );
      if (!item) return { invalid: "ไม่พบพัสดุของคำขอนี้" };
      if (record.qty > item.qty) {
        return { invalid: `พัสดุคงเหลือไม่พอ (คงเหลือ ${item.qty})` };
      }

      await conn.execute("UPDATE supply_items SET qty = qty - ? WHERE id = ?", [
        record.qty,
        record.item_id,
      ]);
      await conn.execute(
        `UPDATE supply_requests
         SET status = 'approved', approved_by = ?, approved_at = NOW(), note = ?
         WHERE id = ?`,
        [actor.id, note, id]
      );
      return { ok: true };
    }

    if (action === "reject") {
      if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
      await conn.execute(
        `UPDATE supply_requests
         SET status = 'rejected', approved_by = ?, approved_at = NOW(), note = ?
         WHERE id = ?`,
        [actor.id, note, id]
      );
      return { ok: true };
    }

    // action === "return"
    if (record.kind !== "borrow") return { invalid: "รายการนี้ไม่ใช่การยืม" };
    if (record.status !== "approved") {
      return { invalid: "คืนได้เฉพาะรายการที่อนุมัติแล้ว" };
    }

    await conn.execute("UPDATE supply_items SET qty = qty + ? WHERE id = ?", [
      record.qty,
      record.item_id,
    ]);
    await conn.execute(
      `UPDATE supply_requests
       SET status = 'returned', returned_at = NOW(), note = COALESCE(NULLIF(?, ''), note)
       WHERE id = ?`,
      [note, id]
    );
    return { ok: true };
  });

  if (!outcome.ok) return outcome;
  return { record: await findSupplyRequest(id) };
}

/* ---------------------------- คำขอการเงิน ---------------------------- */

const FINANCE_SELECT = `
  SELECT r.*,
         u.name AS requester_name,
         a.name AS approver_name
  FROM finance_requests r
  JOIN users u      ON u.id = r.user_id
  LEFT JOIN users a ON a.id = r.approved_by`;

export async function listFinanceRequests({ userId, status } = {}) {
  const where = [];
  const params = [];
  if (userId) {
    where.push("r.user_id = ?");
    params.push(userId);
  }
  if (status) {
    where.push("r.status = ?");
    params.push(status);
  }

  const rows = await query(
    `${FINANCE_SELECT}
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY r.requested_at DESC`,
    params
  );
  return rows.map(mapFinanceRequest);
}

export async function findFinanceRequest(id) {
  return mapFinanceRequest(await queryOne(`${FINANCE_SELECT} WHERE r.id = ?`, [id]));
}

export async function createFinanceRequest({
  userId,
  kind,
  title,
  category,
  amount,
  dueDate,
}) {
  const id = await transaction(async (conn) => {
    const newId = crypto.randomUUID();
    const code = await nextCode(conn, "finance");
    await conn.execute(
      `INSERT INTO finance_requests
         (id, code, user_id, kind, title, category, amount, due_date, status, requested_at, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), '')`,
      [newId, code, userId, kind, title, category, amount, kind === "advance" ? dueDate : null]
    );
    return newId;
  });

  return { record: await findFinanceRequest(id) };
}

/**
 * ดำเนินการกับคำขอทางการเงิน
 * @param {"approve"|"reject"|"pay"|"settle"|"cancel"} action
 */
export async function actOnFinanceRequest({ id, action, actor, note, settledAmount }) {
  const outcome = await transaction(async (conn) => {
    const [[record]] = await conn.query(
      "SELECT * FROM finance_requests WHERE id = ? FOR UPDATE",
      [id]
    );
    if (!record) return { notFound: true };

    const isOfficer = actor.role === "admin" || actor.role === "staff";
    const noteSql = note === undefined ? "" : ", note = ?";
    const noteParam = note === undefined ? [] : [note];

    switch (action) {
      case "cancel": {
        if (record.user_id !== actor.id && !isOfficer) return { forbidden: true };
        if (record.status !== "pending") {
          return { invalid: "ยกเลิกได้เฉพาะคำขอที่รออนุมัติ" };
        }
        await conn.execute(
          `UPDATE finance_requests SET status = 'cancelled'${noteSql} WHERE id = ?`,
          [...noteParam, id]
        );
        return { ok: true };
      }

      case "approve":
      case "reject": {
        if (record.status !== "pending") return { invalid: "คำขอนี้ถูกดำเนินการไปแล้ว" };
        await conn.execute(
          `UPDATE finance_requests
           SET status = ?, approved_by = ?, approved_at = NOW()${noteSql}
           WHERE id = ?`,
          [action === "approve" ? "approved" : "rejected", actor.id, ...noteParam, id]
        );
        return { ok: true };
      }

      case "pay": {
        if (record.status !== "approved") {
          return { invalid: "จ่ายเงินได้เฉพาะรายการที่อนุมัติแล้ว" };
        }
        await conn.execute(
          `UPDATE finance_requests SET status = 'paid', paid_at = NOW()${noteSql} WHERE id = ?`,
          [...noteParam, id]
        );
        return { ok: true };
      }

      default: {
        // action === "settle"
        if (record.kind !== "advance") return { invalid: "รายการนี้ไม่ใช่เงินยืม" };
        if (record.status !== "paid") {
          return { invalid: "ล้างหนี้ได้เฉพาะรายการที่จ่ายเงินแล้ว" };
        }
        await conn.execute(
          `UPDATE finance_requests
           SET status = 'settled', settled_amount = ?, settled_at = NOW()${noteSql}
           WHERE id = ?`,
          [settledAmount, ...noteParam, id]
        );
        return { ok: true };
      }
    }
  });

  if (!outcome.ok) return outcome;
  return { record: await findFinanceRequest(id) };
}

/* ------------------------------ แดชบอร์ด ------------------------------ */

const LOW_STOCK_THRESHOLD = 10;

export async function dashboardSummary(user) {
  const scoped = user.role === "user";
  const userFilter = scoped ? "WHERE user_id = ?" : "";
  const params = scoped ? [user.id] : [];
  const today = new Date().toISOString().slice(0, 10);

  const [supplyStats] = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'pending') AS pending,
       SUM(kind = 'borrow' AND status = 'approved') AS borrowed,
       SUM(kind = 'borrow' AND status = 'approved' AND due_date IS NOT NULL AND due_date < ?)
         AS overdue
     FROM supply_requests ${userFilter}`,
    [today, ...params]
  );

  const [financeStats] = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(status = 'pending') AS pending,
       COALESCE(SUM(CASE WHEN status IN ('approved','paid','settled') THEN amount END), 0)
         AS approved_amount,
       COALESCE(SUM(CASE WHEN status IN ('paid','settled') THEN amount END), 0)
         AS paid_amount,
       COALESCE(SUM(CASE WHEN kind = 'advance' AND status = 'paid' THEN amount END), 0)
         AS outstanding_advance
     FROM finance_requests ${userFilter}`,
    params
  );

  const lowStock = await query(
    `SELECT id, code, name, qty, unit FROM supply_items
     WHERE qty <= ? ORDER BY qty ASC`,
    [LOW_STOCK_THRESHOLD]
  );

  const [itemCount] = await query("SELECT COUNT(*) AS total FROM supply_items");

  const recentSupply = await query(
    `${SUPPLY_SELECT}
     ${scoped ? "WHERE r.user_id = ?" : ""}
     ORDER BY r.requested_at DESC LIMIT 5`,
    params
  );

  const recentFinance = await query(
    `${FINANCE_SELECT}
     ${scoped ? "WHERE r.user_id = ?" : ""}
     ORDER BY r.requested_at DESC LIMIT 5`,
    params
  );

  let users = null;
  if (user.role === "admin") {
    const [counts] = await query(
      `SELECT
         COUNT(*) AS total,
         SUM(active = 1) AS active,
         SUM(role = 'admin') AS admins,
         SUM(role = 'staff') AS staffs,
         SUM(role = 'user')  AS members
       FROM users`
    );
    users = {
      total: Number(counts.total),
      active: Number(counts.active),
      byRole: {
        admin: Number(counts.admins),
        staff: Number(counts.staffs),
        user: Number(counts.members),
      },
    };
  }

  return {
    role: user.role,
    supply: {
      total: Number(supplyStats.total),
      pending: Number(supplyStats.pending || 0),
      borrowed: Number(supplyStats.borrowed || 0),
      overdue: Number(supplyStats.overdue || 0),
    },
    finance: {
      total: Number(financeStats.total),
      pending: Number(financeStats.pending || 0),
      approvedAmount: Number(financeStats.approved_amount),
      paidAmount: Number(financeStats.paid_amount),
      outstandingAdvance: Number(financeStats.outstanding_advance),
    },
    stock: {
      items: Number(itemCount.total),
      lowStock: lowStock.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        qty: i.qty,
        unit: i.unit,
      })),
    },
    users,
    recent: {
      supply: recentSupply.map((row) => {
        const r = mapSupplyRequest(row);
        return {
          id: r.id,
          code: r.code,
          kind: r.kind,
          status: r.status,
          qty: r.qty,
          requestedAt: r.requestedAt,
          title: r.itemName,
          requesterName: r.requesterName,
        };
      }),
      finance: recentFinance.map((row) => {
        const r = mapFinanceRequest(row);
        return {
          id: r.id,
          code: r.code,
          kind: r.kind,
          status: r.status,
          amount: r.amount,
          requestedAt: r.requestedAt,
          title: r.title,
          requesterName: r.requesterName,
        };
      }),
    },
  };
}
