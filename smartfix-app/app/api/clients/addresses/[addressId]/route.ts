import type { NextRequest } from "next/server";
import { AddressController } from "@/src/controllers/AddressController";

type Context = { params: Promise<{ addressId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  return AddressController.update(request, (await context.params).addressId);
}

export async function DELETE(request: NextRequest, context: Context) {
  return AddressController.remove(request, (await context.params).addressId);
}
