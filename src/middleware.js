import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

/**
 * ป้องกันหน้าในกลุ่ม /dashboard แบบเบื้องต้น (ตรวจว่ามีคุกกี้ session หรือไม่)
 * การตรวจลายเซ็นและสิทธิ์จริงทำที่ Server Component และ Route Handler
 */
export function middleware(request) {
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname, search } = request.nextUrl;

  if (!hasSession && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
