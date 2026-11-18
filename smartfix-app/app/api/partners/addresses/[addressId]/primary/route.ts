import { NextRequest } from "next/server";
import { PartnerAddressController } from "@/src/controllers/PartnerAddressController";
export const runtime = "nodejs";
export async function PATCH(request: NextRequest, context: { params: Promise<{ addressId: string }> }) { return PartnerAddressController.setPrimary(request, (await context.params).addressId); }
