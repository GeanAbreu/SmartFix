import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { ClientDevice } from "@/src/models";
import {
  createLocalDevice,
  deleteLocalDevice,
  listLocalDevices,
  updateLocalDevice,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import { deviceInputSchema } from "@/src/validations/device.validation";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function clientIdFrom(request: NextRequest) {
  const session = requireSession(request);
  if (session.role !== "client") {
    throw new AppError("Esta área é exclusiva para clientes.", 403, "FORBIDDEN");
  }
  return session.sub;
}

function serialize(device: ClientDevice) {
  return {
    id: device.id,
    tipo: device.tipo,
    marca: device.marca,
    modelo: device.modelo,
    fotoUrl: device.foto_url,
  };
}

export class DeviceController {
  static async list(request: NextRequest) {
    try {
      const clientId = clientIdFrom(request);
      const devices = usesLocalAuthStore()
        ? await listLocalDevices(clientId)
        : (assertDatabaseConfigured(), await ClientDevice.findAll({
            where: { client_id: clientId },
            order: [["tipo", "ASC"], ["marca", "ASC"], ["modelo", "ASC"]],
          }));

      return noStoreResponse(NextResponse.json({
        success: true,
        data: {
          devices: devices.map((device) =>
            device instanceof ClientDevice ? serialize(device) : device
          ),
        },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async create(request: NextRequest) {
    try {
      const clientId = clientIdFrom(request);
      const input = deviceInputSchema.parse(await request.json());
      const device = usesLocalAuthStore()
        ? await createLocalDevice(clientId, input)
        : (assertDatabaseConfigured(), await ClientDevice.create({
            client_id: clientId,
            tipo: input.tipo,
            marca: input.marca,
            modelo: input.modelo,
            foto_url: input.fotoUrl,
          }));

      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Dispositivo cadastrado com sucesso.",
        data: { device: device instanceof ClientDevice ? serialize(device) : device },
      }, { status: 201 }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async update(request: NextRequest, deviceId: string) {
    try {
      const clientId = clientIdFrom(request);
      const input = deviceInputSchema.parse(await request.json());
      let device;

      if (usesLocalAuthStore()) {
        device = await updateLocalDevice(clientId, deviceId, input);
      } else {
        assertDatabaseConfigured();
        const existing = await ClientDevice.findOne({
          where: { id: deviceId, client_id: clientId },
        });
        if (!existing) {
          throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
        }
        device = await existing.update({
          tipo: input.tipo,
          marca: input.marca,
          modelo: input.modelo,
          foto_url: input.fotoUrl,
        });
      }

      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Dispositivo atualizado com sucesso.",
        data: { device: device instanceof ClientDevice ? serialize(device) : device },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async remove(request: NextRequest, deviceId: string) {
    try {
      const clientId = clientIdFrom(request);

      if (usesLocalAuthStore()) {
        await deleteLocalDevice(clientId, deviceId);
      } else {
        assertDatabaseConfigured();
        const device = await ClientDevice.findOne({
          where: { id: deviceId, client_id: clientId },
        });
        if (!device) {
          throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
        }
        await device.destroy();
      }

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
