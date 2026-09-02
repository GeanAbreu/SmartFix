import { z } from "zod";

function isValidCep(value: string) {
  const cep = value.replace(/\D/g, "");
  return cep.length === 8 && !/^(\d)\1{7}$/.test(cep);
}

export const addressInputSchema = z.object({
  apelido: z.string().trim().min(2, "Informe uma identificação para o endereço.").max(50),
  cep: z.string().trim().refine(isValidCep, "Informe um CEP válido."),
  logradouro: z.string().trim().min(1, "Informe o logradouro.").max(200),
  numero: z.string().trim().min(1, "Informe o número.").max(20),
  complemento: z.string().trim().max(100).optional().default(""),
  bairro: z.string().trim().min(1, "Informe o bairro.").max(100),
  cidade: z.string().trim().min(1, "Informe a cidade.").max(100),
  estado: z.string().trim().length(2, "Informe a UF com duas letras.").transform((value) => value.toUpperCase()),
  principal: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressInputSchema>;
