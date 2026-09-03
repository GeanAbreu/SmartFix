import type { NextRequest } from "next/server";
import { DeviceController } from "@/src/controllers/DeviceController";

type DeviceContext = { params: Promise<{ deviceId: string }> };

export const deviceRoutes = {
  list: (request: NextRequest) => DeviceController.list(request),
  create: (request: NextRequest) => DeviceController.create(request),
  update: async (request: NextRequest, context: DeviceContext) =>
    DeviceController.update(request, (await context.params).deviceId),
  remove: async (request: NextRequest, context: DeviceContext) =>
    DeviceController.remove(request, (await context.params).deviceId),
};
