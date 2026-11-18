import { NextRequest } from "next/server";
import { PartnerAddressController } from "@/src/controllers/PartnerAddressController";
export const runtime = "nodejs";
export async function PUT(request: NextRequest, context: { params: Promise<{ addressId: string }> }) { return PartnerAddressController.update(request, (await context.params).addressId); }
export async function DELETE(request: NextRequest, context: { params: Promise<{ addressId: string }> }) { return PartnerAddressController.remove(request, (await context.params).addressId); }
