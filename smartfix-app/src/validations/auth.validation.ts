import { z } from "zod";
import { isValidCnpj, isValidCpf } from "./br-documents";

export const loginSchema = z.object({
  identificador: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail, CPF ou CNPJ.")
    .max(150, "Identificador muito longo."),
  senha: z.string().min(1, "Informe sua senha.").max(128, "Senha muito longa."),
});

export const registerSchema = z
  .object({
    tipoUsuario: z.enum(["cliente", "parceiro"]),
    nomeCompleto: z
      .string()
      .trim()
      .min(3, "Informe o nome completo ou razão social.")
      .max(150, "Nome muito longo."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Informe um e-mail válido.")
      .max(150, "E-mail muito longo."),
    telefone: z
      .string()
      .trim()
      .refine(
        (value) => /^\d{10,11}$/.test(value.replace(/\D/g, "")),
        "Informe um telefone válido."
      ),
    documento: z.string().trim().max(18, "Documento muito longo."),
    dataNascimento: z
      .string()
      .trim()
      .regex(/^$|^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida.")
      .optional()
      .default(""),
    senha: z
      .string()
      .min(8, "A senha deve possuir pelo menos 8 caracteres.")
      .max(128, "A senha deve possuir no máximo 128 caracteres.")
      .regex(/\d/, "A senha deve possuir pelo menos um número.")
      .regex(/[^a-zA-Z0-9]/, "A senha deve possuir pelo menos um símbolo."),
    confirmarSenha: z.string().max(128, "Confirmação de senha muito longa."),
    cep: z
      .string()
      .trim()
      .refine(
        (value) => /^\d{8}$/.test(value.replace(/\D/g, "")),
        "Informe um CEP válido."
      ),
    rua: z.string().trim().min(1, "Informe o logradouro.").max(200),
    numero: z.string().trim().min(1, "Informe o número.").max(20),
    complemento: z.string().trim().max(100).optional().default(""),
    bairro: z.string().trim().min(1, "Informe o bairro.").max(100),
    municipio: z.string().trim().min(1, "Informe o município.").max(100),
    uf: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "Informe a UF com 2 letras."),
  })
  .superRefine((data, ctx) => {
    if (data.senha !== data.confirmarSenha) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmarSenha"],
        message: "As senhas não conferem.",
      });
    }

    if (data.tipoUsuario === "cliente") {
      if (!isValidCpf(data.documento)) {
        ctx.addIssue({
          code: "custom",
          path: ["documento"],
          message: "CPF inválido.",
        });
      }

      if (!data.dataNascimento) {
        ctx.addIssue({
          code: "custom",
          path: ["dataNascimento"],
          message: "Informe a data de nascimento.",
        });
      }
    } else if (!isValidCnpj(data.documento)) {
      ctx.addIssue({
        code: "custom",
        path: ["documento"],
        message: "CNPJ inválido.",
      });
    }
  });
