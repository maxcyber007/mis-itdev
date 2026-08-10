import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import { json } from "@/lib/session";

export async function POST() {
  cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return json({ ok: true });
}
