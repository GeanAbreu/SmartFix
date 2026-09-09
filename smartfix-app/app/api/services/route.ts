import { contributionRoutes } from "@/src/routes/contribution.routes";
export const runtime = "nodejs";
export const GET = contributionRoutes.listServices;
export const POST = contributionRoutes.createService;
