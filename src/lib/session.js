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
    return json(
      {
        message:
          "เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาตรวจสอบว่า MySQL/MariaDB กำลังทำงานอยู่ และค่า DB_HOST/DB_PORT ถูกต้อง",
      },
      503
    );
  }

  const noPrivilege = ["ER_DBACCESS_DENIED_ERROR", "ER_ACCESS_DENIED_ERROR"];
  if (noPrivilege.includes(error?.code)) {
    return json(
      {
        message:
          "เชื่อมต่อฐานข้อมูลไม่ได้: ชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง หรือผู้ใช้นี้ไม่มีสิทธิ์เพียงพอ " +
          "(ต้องมีสิทธิ์ CREATE บนฐานข้อมูลเพื่อให้ระบบสร้างตารางอัตโนมัติ)",
      },
      503
    );
  }

  if (error?.code === "ER_BAD_DB_ERROR") {
    return json(
      { message: "ไม่พบฐานข้อมูลตามชื่อที่ตั้งค่าไว้ (DB_NAME) และสร้างให้อัตโนมัติไม่สำเร็จ" },
      503
    );
  }

  return json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, 500);
}
