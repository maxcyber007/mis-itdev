import { dbError, getCurrentUser, json } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ message: "กรุณาเข้าสู่ระบบ" }, 401);
    return json({ user });
  } catch (error) {
    return dbError(error);
  }
}
