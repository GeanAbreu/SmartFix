import "server-only";

import { ClientDevice, RepairOrderModel } from "@/src/models";
import type { DeviceInput } from "@/src/validations/device.validation";

export function findDevicesByClient(clientId: string) {
  return ClientDevice.findAll({
    where: { client_id: clientId },
    order: [["tipo", "ASC"], ["marca", "ASC"], ["modelo", "ASC"]],
  });
}

export function createDevice(clientId: string, input: DeviceInput) {
  return ClientDevice.create({
    client_id: clientId,
    tipo: input.tipo,
    marca: input.marca,
    modelo: input.modelo,
    foto_url: input.fotoUrl,
    apelido: input.apelido,
    numero_serie: input.numeroSerie,
    issue_type: input.issueType ?? "",
    issue_description: input.issueDescription ?? "",
  });
}

export function findDeviceByClient(deviceId: string, clientId: string) {
  return ClientDevice.findOne({
    where: { id: deviceId, client_id: clientId },
  });
}

export function updateDevice(device: ClientDevice, input: DeviceInput) {
  return device.update({
    tipo: input.tipo,
    marca: input.marca,
    modelo: input.modelo,
    foto_url: input.fotoUrl,
    apelido: input.apelido,
    numero_serie: input.numeroSerie,
    ...(input.issueType !== undefined ? { issue_type: input.issueType } : {}),
    ...(input.issueDescription !== undefined
      ? { issue_description: input.issueDescription }
      : {}),
  });
}

export function countRepairOrdersByDevice(deviceId: string) {
  return RepairOrderModel.count({ where: { device_id: deviceId } });
}

export function deleteDevice(device: ClientDevice) {
  return device.destroy();
}
