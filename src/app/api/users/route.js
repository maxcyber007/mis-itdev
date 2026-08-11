import { hashPassword, ROLES } from "@/lib/auth";
import { createUser, listUsers, publicUser } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireUser(["admin"]);
    if (error) return error;

    const users = (await listUsers()).map(publicUser);
    return json({ users });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request) {
  try {
    const { error } = await requireUser(["admin"]);
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

    const created = await createUser(
      { username, password, name, role, email },
      hashPassword
    );
    if (created.conflict) return json({ message: "มีชื่อผู้ใช้นี้อยู่แล้ว" }, 409);

    return json({ user: publicUser(created.user) }, 201);
  } catch (error) {
    return dbError(error);
  }
}
