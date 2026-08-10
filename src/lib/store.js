import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword } from "./auth";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

/**
 * ชั้นเข้าถึงข้อมูลของระบบ MIS (เก็บเป็นไฟล์ JSON)
 * ถ้าจะย้ายไปใช้ MySQL ของ AppServ ให้แก้เฉพาะไฟล์นี้ โดยคงรูปแบบฟังก์ชันเดิมไว้
 */

function seed() {
  const now = new Date().toISOString();
  const mkUser = (username, password, name, role, email) => {
    const { salt, hash } = hashPassword(password);
    return {
      id: crypto.randomUUID(),
      username,
      salt,
      hash,
      name,
      role,
      email,
      active: true,
      createdAt: now,
    };
  };

  const admin = mkUser(
    "admin",
    "admin1234",
    "ผู้ดูแลระบบ",
    "admin",
    "admin@cmtc.ac.th"
  );
  const staff = mkUser(
    "staff",
    "staff1234",
    "เจ้าหน้าที่พัสดุ/การเงิน",
    "staff",
    "staff@cmtc.ac.th"
  );
  const user = mkUser(
    "user",
    "user1234",
    "ครูผู้สอน แผนกเทคโนโลยีสารสนเทศ",
    "user",
    "user@cmtc.ac.th"
  );

  const item = (code, name, category, unit, qty, type, location) => ({
    id: crypto.randomUUID(),
    code,
    name,
    category,
    unit,
    qty,
    type,
    location,
    createdAt: now,
  });

  return {
    users: [admin, staff, user],
    supplyItems: [
      item("IT-001", "กระดาษ A4 80 แกรม", "วัสดุสำนักงาน", "รีม", 120, "consumable", "ห้องพัสดุ 1"),
      item("IT-002", "หมึกพิมพ์ HP 85A", "วัสดุคอมพิวเตอร์", "กล่อง", 25, "consumable", "ห้องพัสดุ 1"),
      item("IT-003", "สาย LAN CAT6 (ม้วน 100 ม.)", "วัสดุคอมพิวเตอร์", "ม้วน", 8, "consumable", "ห้องเครือข่าย"),
      item("IT-101", "โน้ตบุ๊ก Lenovo ThinkPad", "ครุภัณฑ์", "เครื่อง", 6, "durable", "ห้องปฏิบัติการ 331"),
      item("IT-102", "โปรเจกเตอร์ Epson EB-X06", "ครุภัณฑ์", "เครื่อง", 4, "durable", "ห้องสื่อการสอน"),
      item("IT-103", "กล้องถ่ายภาพ Canon EOS", "ครุภัณฑ์", "ตัว", 2, "durable", "ห้องพัสดุ 2"),
    ],
    supplyRequests: [],
    financeRequests: [],
    counters: { supply: 0, finance: 0 },
  };
}

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seed(), null, 2), "utf8");
  }
}

function readDb() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  ensureFile();
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
}

// อ่าน-แก้ไข-เขียน แบบต่อคิว กันคำขอพร้อมกันเขียนทับกันเอง
let queue = Promise.resolve();

export function read() {
  return readDb();
}

export function update(mutator) {
  const run = queue.then(() => {
    const db = readDb();
    const result = mutator(db);
    writeDb(db);
    return result;
  });
  // กันไม่ให้ error ของคำขอหนึ่งทำให้คิวทั้งเส้นพัง
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function nextCode(db, kind) {
  const prefix = kind === "supply" ? "PS" : "FN";
  db.counters[kind] = (db.counters[kind] || 0) + 1;
  const year = (new Date().getFullYear() + 543).toString().slice(-2);
  return `${prefix}${year}-${String(db.counters[kind]).padStart(4, "0")}`;
}

export function publicUser(u) {
  if (!u) return null;
  const { salt, hash, ...rest } = u;
  return rest;
}
