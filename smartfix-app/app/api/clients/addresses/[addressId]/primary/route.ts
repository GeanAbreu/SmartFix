import type { NextRequest } from "next/server";
import { AddressController } from "@/src/controllers/AddressController";

type Context = { params: Promise<{ addressId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  return AddressController.setPrimary(request, (await context.params).addressId);
}
