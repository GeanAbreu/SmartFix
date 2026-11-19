import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(100),
  email: z.string().trim().email("Informe um e-mail válido.").max(254),
  phone: z.string().trim().max(30).optional().default(""),
  subject: z.string().trim().min(3, "Informe o assunto.").max(150),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres.").max(5_000),
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
