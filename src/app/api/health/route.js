import { queryOne } from "@/lib/db";
import { json } from "@/lib/session";

export const dynamic = "force-dynamic";

/** ใช้โดย HEALTHCHECK ของ Docker และหน้าสถานะของ Portainer */
export async function GET() {
  try {
    await queryOne("SELECT 1 AS ok");
    return json({ status: "ok", database: "connected" });
  } catch (error) {
    return json(
      { status: "error", database: "disconnected", code: error?.code || null },
      503
    );
  }
}
