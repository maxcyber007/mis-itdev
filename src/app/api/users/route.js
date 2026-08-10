import crypto from "crypto";
import { hashPassword, ROLES } from "@/lib/auth";
import { read, update, publicUser } from "@/lib/store";
import { requireUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = requireUser(["admin"]);
  if (error) return error;

  const users = read()
    .users.map(publicUser)
    .sort((a, b) => a.username.localeCompare(b.username));
  return json({ users });
}

export async function POST(request) {
  const { error } = requireUser(["admin"]);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();
  const role = String(body.role || "user");
  const email = String(body.email || "").trim();

  if (!username || !password || !name) {
    return json({ message: "กรุณากรอกชื่อผู้ใช้ รหัสผ่าน และชื่อ-สกุล" }, 400);
  }
  if (password.length < 8) {
    return json({ message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, 400);
  }
  if (!Object.keys(ROLES).includes(role)) {
    return json({ message: "สิทธิ์การใช้งานไม่ถูกต้อง" }, 400);
  }

  const created = await update((db) => {
    if (
      db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())
    ) {
      return { conflict: true };
    }
    const { salt, hash } = hashPassword(password);
    const user = {
      id: crypto.randomUUID(),
      username,
      salt,
      hash,
      name,
      role,
      email,
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return { user };
  });

  if (created.conflict) return json({ message: "มีชื่อผู้ใช้นี้อยู่แล้ว" }, 409);
  return json({ user: publicUser(created.user) }, 201);
}
