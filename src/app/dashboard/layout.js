import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }) {
  let user;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("[mis] database error:", error);
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink-900">
            เชื่อมต่อฐานข้อมูลไม่ได้
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            ระบบไม่สามารถติดต่อเซิร์ฟเวอร์ฐานข้อมูล MySQL ได้
            กรุณาตรวจสอบการตั้งค่า <code className="text-ink-700">DB_HOST</code> และสถานะของ
            container ฐานข้อมูล แล้วลองใหม่อีกครั้ง
          </p>
        </div>
      </main>
    );
  }

  if (!user) redirect("/login");

  return <Shell user={user}>{children}</Shell>;
}
