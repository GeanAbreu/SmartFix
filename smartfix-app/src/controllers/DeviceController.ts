import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import {
  createDevice,
  deleteDevice,
  listDevices,
  updateDevice,
} from "@/src/services/device.service";
import { deviceInputSchema } from "@/src/validations/device.validation";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

async function clientIdFrom(request: NextRequest) {
  const session = await requireSession(request);
  if (session.role !== "client") {
    throw new AppError("Esta área é exclusiva para clientes.", 403, "FORBIDDEN");
  }
  return session.sub;
}

export class DeviceController {
  static async list(request: NextRequest) {
    try {
      const clientId = await clientIdFrom(request);
      const devices = await listDevices(clientId);

      return noStoreResponse(NextResponse.json({
        success: true,
        data: {
          devices,
        },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async create(request: NextRequest) {
    try {
      const clientId = await clientIdFrom(request);
      const input = deviceInputSchema.parse(await request.json());
      const device = await createDevice(clientId, input);

      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Dispositivo cadastrado com sucesso.",
        data: { device },
      }, { status: 201 }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async update(request: NextRequest, deviceId: string) {
    try {
      const clientId = await clientIdFrom(request);
      const input = deviceInputSchema.parse(await request.json());
      const device = await updateDevice(clientId, deviceId, input);

      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Dispositivo atualizado com sucesso.",
        data: { device },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async remove(request: NextRequest, deviceId: string) {
    try {
      const clientId = await clientIdFrom(request);

      await deleteDevice(clientId, deviceId);

      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Dispositivo excluído com sucesso.",
        data: {},
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
}
