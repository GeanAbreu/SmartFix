import { z } from "zod";
export const profileInput = z
  .object({
    nome: z.string().trim().min(3, "Informe o nome completo.").max(150),
    telefone: z
      .string()
      .trim()
      .max(20)
      .refine(
        (value) => /^\d{10,11}$/.test(value.replace(/\D/g, "")),
        "Informe um telefone válido.",
      ),
  })
  .strict();
