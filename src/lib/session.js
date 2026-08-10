import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { read } from "./store";

/** อ่าน session ปัจจุบันจากคุกกี้ (ใช้ได้ทั้งใน Server Component และ Route Handler) */
export function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** อ่านข้อมูลผู้ใช้ล่าสุดจากฐานข้อมูลตาม session (คืน null ถ้าถูกปิดการใช้งาน/ถูกลบ) */
export function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  const user = read().users.find((u) => u.id === session.id);
  if (!user || !user.active) return null;
  const { salt, hash, ...rest } = user;
  return rest;
}

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * ตรวจสิทธิ์สำหรับ API
 * @param {string[]} [roles] ถ้าระบุ จะอนุญาตเฉพาะบทบาทเหล่านี้
 * @returns {{user?: object, error?: NextResponse}}
 */
export function requireUser(roles) {
  const user = getCurrentUser();
  if (!user) return { error: json({ message: "กรุณาเข้าสู่ระบบ" }, 401) };
  if (roles && !roles.includes(user.role)) {
    return { error: json({ message: "ไม่มีสิทธิ์ใช้งานส่วนนี้" }, 403) };
  }
  return { user };
}
