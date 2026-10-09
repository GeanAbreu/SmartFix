import { TrackingController } from "@/src/controllers/TrackingController";

export const runtime = "nodejs";
type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: Context) {
  return TrackingController.show((await context.params).token);
}
