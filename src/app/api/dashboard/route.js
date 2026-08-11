import { dashboardSummary } from "@/lib/store";
import { dbError, json, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user, error } = await requireUser();
    if (error) return error;

    return json(await dashboardSummary(user));
  } catch (error) {
    return dbError(error);
  }
}
