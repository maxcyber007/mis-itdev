import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const user = getCurrentUser();
  if (!user) redirect("/login");

  return <Shell user={user}>{children}</Shell>;
}
