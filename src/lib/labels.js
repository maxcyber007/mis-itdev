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
  pending: "text-bg-warning",
  approved: "text-bg-primary",
  rejected: "text-bg-danger",
  returned: "text-bg-success",
  cancelled: "text-bg-secondary",
  paid: "text-bg-info",
  settled: "text-bg-success",
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
