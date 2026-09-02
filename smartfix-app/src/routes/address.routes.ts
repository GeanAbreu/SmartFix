import type { NextRequest } from "next/server";
import { AddressController } from "@/src/controllers/AddressController";

type AddressContext = { params: Promise<{ addressId: string }> };

export const addressRoutes = {
  list: (request: NextRequest) => AddressController.list(request),
  create: (request: NextRequest) => AddressController.create(request),
  update: async (request: NextRequest, context: AddressContext) =>
    AddressController.update(request, (await context.params).addressId),
  remove: async (request: NextRequest, context: AddressContext) =>
    AddressController.remove(request, (await context.params).addressId),
  setPrimary: async (request: NextRequest, context: AddressContext) =>
    AddressController.setPrimary(request, (await context.params).addressId),
};
