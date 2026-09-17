import type { ClientDevice } from "@/src/types/api";
import { CHECKLIST, SYMPTOMS } from "@/src/types/workflow";

export type RepairRequestDraft = {
  deviceId: string;
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
  const deviceId = [initialDeviceId, saved.deviceId, devices[0]?.id]
    .find((id) => devices.some((device) => device.id === id)) || "";
  const device = devices.find((item) => item.id === deviceId);
  const sameDevice = saved.deviceId === deviceId;
  return {
    deviceId,
    partnerId: [initialPartnerId, saved.partnerId]
      .find((id) => partners.some((partner) => partner.id === id)) || "",
    problem: sameDevice && typeof saved.problem === "string" && saved.problem.trim()
      ? saved.problem : device?.issueDescription || device?.issueType || "",
    symptoms: Array.isArray(saved.symptoms)
      ? saved.symptoms.filter((item): item is string => typeof item === "string" && SYMPTOMS.includes(item)) : [],
    checklist: Array.isArray(saved.checklist)
      ? saved.checklist.filter((item): item is string => typeof item === "string" && CHECKLIST.includes(item)) : [],
  };
}
