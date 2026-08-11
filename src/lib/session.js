import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { findUserById, publicUser } from "./store";

/** อ่าน session ปัจจุบันจากคุกกี้ (ใช้ได้ทั้งใน Server Component และ Route Handler) */
export function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** อ่านข้อมูลผู้ใช้ล่าสุดจากฐานข้อมูลตาม session (คืน null ถ้าถูกปิดการใช้งาน/ถูกลบ) */
export async function getCurrentUser() {
  const session = getSession();
  if (!session) return null;

  const user = await findUserById(session.id);
  if (!user || !user.active) return null;
  return publicUser(user);
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * ตรวจสิทธิ์สำหรับ API
 * @param {string[]} [roles] ถ้าระบุ จะอนุญาตเฉพาะบทบาทเหล่านี้
 * @returns {Promise<{user?: object, error?: NextResponse}>}
 */
export async function requireUser(roles) {
  const user = await getCurrentUser();
  if (!user) return { error: json({ message: "กรุณาเข้าสู่ระบบ" }, 401) };
  if (roles && !roles.includes(user.role)) {
    return { error: json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" }, 403) };
  }
  return { user };
}

/** แปลงข้อผิดพลาดจากฐานข้อมูลเป็นข้อความที่ผู้ใช้เข้าใจได้ */
export function dbError(error) {
  console.error("[mis] database error:", error);
  const offline = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "PROTOCOL_CONNECTION_LOST"];
  if (offline.includes(error?.code)) {
    return json({ message: "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาติดต่อผู้ดูแลระบบ" }, 503);
  }
  return json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, 500);
}
