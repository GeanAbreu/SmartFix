import { contributionRoutes } from "@/src/routes/contribution.routes";
export const runtime = "nodejs";
export const GET = contributionRoutes.listOrders;
export const POST = contributionRoutes.createOrder;
