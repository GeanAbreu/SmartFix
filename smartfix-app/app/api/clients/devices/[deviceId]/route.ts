import type { NextRequest } from "next/server";
import { DeviceController } from "@/src/controllers/DeviceController";

type Context = { params: Promise<{ deviceId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  return DeviceController.update(request, (await context.params).deviceId);
}

export async function DELETE(request: NextRequest, context: Context) {
  return DeviceController.remove(request, (await context.params).deviceId);
}
