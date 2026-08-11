// ป้ายกำกับและตัวช่วยจัดรูปแบบที่ใช้ร่วมกันทั้งฝั่ง client และ server
// (ไฟล์นี้ต้องไม่ import โมดูลของ Node เพื่อให้ Client Component ใช้ได้)

export const ROLE_LABELS = {
  admin: "ผู้ดูแลระบบ",
  staff: "เจ้าหน้าที่",
  user: "ผู้ใช้ทั่วไป",
};

export const SUPPLY_KIND_LABELS = {
  issue: "เบิก",
  borrow: "ยืม",
};

export const FINANCE_KIND_LABELS = {
  reimburse: "เบิกจ่าย",
  advance: "ยืมเงิน",
};

export const ITEM_TYPE_LABELS = {
  consumable: "วัสดุสิ้นเปลือง",
  durable: "ครุภัณฑ์",
};

export const STATUS_LABELS = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  returned: "คืนแล้ว",
  cancelled: "ยกเลิก",
  paid: "จ่ายเงินแล้ว",
  settled: "ล้างหนี้แล้ว",
};

export const STATUS_CLASSES = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  approved: "bg-brand-50 text-brand-700 ring-brand-600/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
  returned: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-ink-100 text-ink-600 ring-ink-500/20",
  paid: "bg-sky-50 text-sky-700 ring-sky-600/20",
  settled: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export const STATUS_DOT = {
  pending: "bg-amber-500",
  approved: "bg-brand-500",
  rejected: "bg-rose-500",
  returned: "bg-emerald-500",
  cancelled: "bg-ink-400",
  paid: "bg-sky-500",
  settled: "bg-emerald-500",
};

export function formatBaht(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(Number(value || 0));
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(
    new Date(value)
  );
}
