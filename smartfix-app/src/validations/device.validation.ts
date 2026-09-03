import { z } from "zod";
import { DEVICE_TYPES, getDeviceBrands, getDeviceModels } from "@/src/constants/device-catalog";

const MAX_PHOTO_DATA_URL_LENGTH = 2_100_000;
const supportedPhoto = /^(?:data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/=]+|https:\/\/\S+)$/;

export const deviceInputSchema = z
  .object({
    tipo: z.string().trim().min(1, "Selecione o tipo de dispositivo."),
    marca: z.string().trim().min(1, "Selecione a marca."),
    modelo: z.string().trim().min(1, "Selecione o modelo."),
    fotoUrl: z
      .string()
      .trim()
      .min(1, "Adicione uma foto do dispositivo.")
      .max(MAX_PHOTO_DATA_URL_LENGTH, "A foto é muito grande.")
      .regex(supportedPhoto, "Envie uma imagem JPG, PNG ou WebP válida."),
  })
  .superRefine((data, context) => {
    if (!DEVICE_TYPES.includes(data.tipo)) {
      context.addIssue({ code: "custom", path: ["tipo"], message: "Selecione um tipo válido." });
      return;
    }

    if (!getDeviceBrands(data.tipo).includes(data.marca)) {
      context.addIssue({ code: "custom", path: ["marca"], message: "Selecione uma marca válida." });
      return;
    }

    if (!getDeviceModels(data.tipo, data.marca).includes(data.modelo)) {
      context.addIssue({ code: "custom", path: ["modelo"], message: "Selecione um modelo válido." });
    }
  });

export type DeviceInput = z.infer<typeof deviceInputSchema>;
