import mysql from "mysql2/promise";
import crypto from "crypto";
import { hashPassword } from "./auth";

/**
 * การเชื่อมต่อฐานข้อมูล MySQL/MariaDB
 * สร้างตารางและใส่ข้อมูลตั้งต้นให้อัตโนมัติเมื่อเรียกใช้ครั้งแรก
 */

let pool;
let ready;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3308),
      user: process.env.DB_USER || "admin_mis_itdev",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "db_mis_itdev",
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      charset: "utf8mb4_unicode_ci",
      timezone: "Z",
      dateStrings: ["DATE"],
      enableKeepAlive: true,
    });
  }
  return pool;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id          CHAR(36)     NOT NULL PRIMARY KEY,
     username    VARCHAR(64)  NOT NULL UNIQUE,
     salt        CHAR(32)     NOT NULL,
     hash        CHAR(128)    NOT NULL,
     name        VARCHAR(191) NOT NULL,
     role        ENUM('admin','staff','user') NOT NULL DEFAULT 'user',
     email       VARCHAR(191) NOT NULL DEFAULT '',
     active      TINYINT(1)   NOT NULL DEFAULT 1,
     created_at  DATETIME     NOT NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS supply_items (
     id          CHAR(36)     NOT NULL PRIMARY KEY,
     code        VARCHAR(64)  NOT NULL UNIQUE,
     name        VARCHAR(191) NOT NULL,
     category    VARCHAR(191) NOT NULL DEFAULT '',
     unit        VARCHAR(32)  NOT NULL DEFAULT '',
     qty         INT          NOT NULL DEFAULT 0,
     type        ENUM('consumable','durable') NOT NULL DEFAULT 'consumable',
     location    VARCHAR(191) NOT NULL DEFAULT '',
     created_at  DATETIME     NOT NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS supply_requests (
     id            CHAR(36)    NOT NULL PRIMARY KEY,
     code          VARCHAR(32) NOT NULL UNIQUE,
     user_id       CHAR(36)    NOT NULL,
     item_id       CHAR(36)    NOT NULL,
     qty           INT         NOT NULL,
     kind          ENUM('issue','borrow') NOT NULL,
     purpose       TEXT        NULL,
     due_date      DATE        NULL,
     status        ENUM('pending','approved','rejected','returned','cancelled')
                   NOT NULL DEFAULT 'pending',
     requested_at  DATETIME    NOT NULL,
     approved_by   CHAR(36)    NULL,
     approved_at   DATETIME    NULL,
     returned_at   DATETIME    NULL,
     note          TEXT        NULL,
     INDEX idx_supply_user (user_id),
     INDEX idx_supply_status (status),
     CONSTRAINT fk_supply_user FOREIGN KEY (user_id) REFERENCES users (id),
     CONSTRAINT fk_supply_item FOREIGN KEY (item_id) REFERENCES supply_items (id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS finance_requests (
     id             CHAR(36)      NOT NULL PRIMARY KEY,
     code           VARCHAR(32)   NOT NULL UNIQUE,
     user_id        CHAR(36)      NOT NULL,
     kind           ENUM('reimburse','advance') NOT NULL,
     title          VARCHAR(191)  NOT NULL,
     category       VARCHAR(191)  NOT NULL DEFAULT '',
     amount         DECIMAL(12,2) NOT NULL,
     due_date       DATE          NULL,
     status         ENUM('pending','approved','rejected','paid','settled','cancelled')
                    NOT NULL DEFAULT 'pending',
     requested_at   DATETIME      NOT NULL,
     approved_by    CHAR(36)      NULL,
     approved_at    DATETIME      NULL,
     paid_at        DATETIME      NULL,
     settled_amount DECIMAL(12,2) NULL,
     settled_at     DATETIME      NULL,
     note           TEXT          NULL,
     INDEX idx_finance_user (user_id),
     INDEX idx_finance_status (status),
     CONSTRAINT fk_finance_user FOREIGN KEY (user_id) REFERENCES users (id)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS counters (
     name  VARCHAR(16) NOT NULL PRIMARY KEY,
     value INT         NOT NULL DEFAULT 0
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function seed(conn) {
  const [[{ total }]] = await conn.query("SELECT COUNT(*) AS total FROM users");
  if (total > 0) return;

  const now = new Date();
  const accounts = [
    ["admin", process.env.SEED_ADMIN_PASSWORD || "admin1234", "ผู้ดูแลระบบ", "admin", "admin@cmtc.ac.th"],
    ["staff", process.env.SEED_STAFF_PASSWORD || "staff1234", "เจ้าหน้าที่พัสดุ/การเงิน", "staff", "staff@cmtc.ac.th"],
    ["user", process.env.SEED_USER_PASSWORD || "user1234", "ครูผู้สอน แผนกเทคโนโลยีสารสนเทศ", "user", "user@cmtc.ac.th"],
  ];

  for (const [username, password, name, role, email] of accounts) {
    const { salt, hash } = hashPassword(password);
    await conn.execute(
      `INSERT INTO users (id, username, salt, hash, name, role, email, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [crypto.randomUUID(), username, salt, hash, name, role, email, now]
    );
  }

  const items = [
    ["IT-001", "กระดาษ A4 80 แกรม", "วัสดุสำนักงาน", "รีม", 120, "consumable", "ห้องพัสดุ 1"],
    ["IT-002", "หมึกพิมพ์ HP 85A", "วัสดุคอมพิวเตอร์", "กล่อง", 25, "consumable", "ห้องพัสดุ 1"],
    ["IT-003", "สาย LAN CAT6 (ม้วน 100 ม.)", "วัสดุคอมพิวเตอร์", "ม้วน", 8, "consumable", "ห้องเครือข่าย"],
    ["IT-101", "โน้ตบุ๊ก Lenovo ThinkPad", "ครุภัณฑ์", "เครื่อง", 6, "durable", "ห้องปฏิบัติการ 331"],
    ["IT-102", "โปรเจกเตอร์ Epson EB-X06", "ครุภัณฑ์", "เครื่อง", 4, "durable", "ห้องสื่อการสอน"],
    ["IT-103", "กล้องถ่ายภาพ Canon EOS", "ครุภัณฑ์", "ตัว", 2, "durable", "ห้องพัสดุ 2"],
  ];

  for (const [code, name, category, unit, qty, type, location] of items) {
    await conn.execute(
      `INSERT INTO supply_items (id, code, name, category, unit, qty, type, location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), code, name, category, unit, qty, type, location, now]
    );
  }

}

/** สร้างตารางและข้อมูลตั้งต้น (ทำครั้งเดียวต่อการรันหนึ่งโปรเซส) */
export function init() {
  if (!ready) {
    ready = (async () => {
      const conn = await getPool().getConnection();
      try {
        for (const statement of SCHEMA) await conn.query(statement);
        await conn.query(
          `INSERT IGNORE INTO counters (name, value) VALUES ('supply', 0), ('finance', 0)`
        );
        await seed(conn);
      } finally {
        conn.release();
      }
    })().catch((error) => {
      ready = undefined; // ให้ลองใหม่ได้ในคำขอถัดไป เช่นตอนฐานข้อมูลยังไม่พร้อม
      throw error;
    });
  }
  return ready;
}

/** คิวรีที่คืนแถวข้อมูล */
export async function query(sql, params = []) {
  await init();
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** คิวรีที่คืนแถวเดียว (หรือ null) */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

/** สั่งเปลี่ยนแปลงข้อมูล คืนผลลัพธ์ของ MySQL */
export async function execute(sql, params = []) {
  await init();
  const [result] = await getPool().execute(sql, params);
  return result;
}

/**
 * ทำงานภายในทรานแซกชัน — ใช้กับขั้นตอนที่ต้องอ่านแล้วเขียนแบบอะตอมมิก
 * เช่น การอนุมัติคำขอที่ต้องตัดจำนวนคงเหลือของพัสดุ
 */
export async function transaction(work) {
  await init();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/** ออกเลขที่เอกสารแบบเรียงลำดับ (ต้องเรียกภายในทรานแซกชัน) */
export async function nextCode(conn, kind) {
  const [[row]] = await conn.query(
    "SELECT value FROM counters WHERE name = ? FOR UPDATE",
    [kind]
  );
  const next = (row?.value || 0) + 1;
  await conn.execute("UPDATE counters SET value = ? WHERE name = ?", [next, kind]);

  const prefix = kind === "supply" ? "PS" : "FN";
  const year = (new Date().getFullYear() + 543).toString().slice(-2);
  return `${prefix}${year}-${String(next).padStart(4, "0")}`;
}
