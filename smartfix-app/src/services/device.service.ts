import "server-only";

import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { ClientDevice } from "@/src/models";
import {
  countRepairOrdersByDevice,
  createDevice as createDatabaseDevice,
  deleteDevice as deleteDatabaseDevice,
  findDeviceByClient,
  findDevicesByClient,
  updateDevice as updateDatabaseDevice,
} from "@/src/repositories/device.repository";
import {
  createLocalDevice,
  deleteLocalDevice,
  listLocalDevices,
  updateLocalDevice,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import type { DeviceInput } from "@/src/validations/device.validation";

function serialize(device: ClientDevice) {
  return {
    id: device.id,
    tipo: device.tipo,
    marca: device.marca,
    modelo: device.modelo,
    fotoUrl: device.foto_url,
    apelido: device.apelido,
    numeroSerie: device.numero_serie,
    issueType: device.issue_type,
    issueDescription: device.issue_description,
  };
}

function present(device: Awaited<ReturnType<typeof createLocalDevice>> | ClientDevice) {
  return device instanceof ClientDevice ? serialize(device) : device;
}

export async function listDevices(clientId: string) {
  if (usesLocalAuthStore()) return listLocalDevices(clientId);

  assertDatabaseConfigured();
  const devices = await findDevicesByClient(clientId);
  return devices.map(serialize);
}

export async function createDevice(clientId: string, input: DeviceInput) {
  const device = usesLocalAuthStore()
    ? await createLocalDevice(clientId, input)
    : (assertDatabaseConfigured(), await createDatabaseDevice(clientId, input));
  return present(device);
}

export async function updateDevice(clientId: string, deviceId: string, input: DeviceInput) {
  if (usesLocalAuthStore()) {
    return updateLocalDevice(clientId, deviceId, input);
  }

  assertDatabaseConfigured();
  const device = await findDeviceByClient(deviceId, clientId);
  if (!device) {
    throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
  }
  return present(await updateDatabaseDevice(device, input));
}

export async function deleteDevice(clientId: string, deviceId: string) {
  if (usesLocalAuthStore()) {
    await deleteLocalDevice(clientId, deviceId);
    return;
  }

  assertDatabaseConfigured();
  const device = await findDeviceByClient(deviceId, clientId);
  if (!device) {
    throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
  }
  if (await countRepairOrdersByDevice(deviceId)) {
    throw new AppError(
      "Este dispositivo possui ordens de reparo e não pode ser excluído.",
      409,
      "DEVICE_IN_USE"
    );
  }
  await deleteDatabaseDevice(device);
}
