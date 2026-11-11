import type { ClientDevice } from "@/src/types/api";
import { CHECKLIST, SYMPTOMS } from "@/src/types/workflow";

export type RepairRequestDraft = {
  deviceId: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  deviceColor: string;
  devicePhotos: string[];
  partnerId: string;
  problem: string;
  symptoms: string[];
  checklist: string[];
};

export function initialRepairRequestDraft(
  devices: ClientDevice[],
  partners: { id: string }[],
  savedValue: unknown,
  initialDeviceId: string,
  initialPartnerId: string,
): RepairRequestDraft {
  const saved = savedValue && typeof savedValue === "object"
    ? savedValue as Partial<RepairRequestDraft> : {};
  const deviceId = [initialDeviceId, saved.deviceId, devices[0]?.id].find((id) => devices.some((device) => device.id === id)) || "";
  const selectedDevice = devices.find((device) => device.id === deviceId);
  return {
    deviceId,
    deviceType: typeof saved.deviceType === "string" ? saved.deviceType : "",
    deviceBrand: typeof saved.deviceBrand === "string" ? saved.deviceBrand : "",
    deviceModel: typeof saved.deviceModel === "string" ? saved.deviceModel : "",
    deviceColor: typeof saved.deviceColor === "string" ? saved.deviceColor : "",
    devicePhotos: Array.isArray(saved.devicePhotos) ? saved.devicePhotos.filter((photo): photo is string => typeof photo === "string").slice(0, 3) : [],
    partnerId: [initialPartnerId, saved.partnerId]
      .find((id) => partners.some((partner) => partner.id === id)) || "",
    problem: saved.deviceId === deviceId && typeof saved.problem === "string" && saved.problem.trim() ? saved.problem : selectedDevice?.issueDescription || "",
    symptoms: Array.isArray(saved.symptoms)
      ? saved.symptoms.filter((item): item is string => typeof item === "string" && SYMPTOMS.includes(item)) : [],
    checklist: Array.isArray(saved.checklist)
      ? saved.checklist.filter((item): item is string => typeof item === "string" && CHECKLIST.includes(item)) : [],
  };
}
