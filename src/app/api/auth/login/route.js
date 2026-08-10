import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { read, publicUser } from "@/lib/store";
import { json } from "@/lib/session";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, 400);
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) {
    return json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" }, 400);
  }

  const user = read().users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    return json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, 401);
  }
  if (!user.active) {
    return json({ message: "บัญชีนี้ถูกระงับการใช้งาน" }, 403);
  }

  cookies().set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });

  return json({ user: publicUser(user) });
}
