import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  accountByEmail,
  accountById,
  changePassword,
} from "@/src/services/account.service";
import { withWorkflow } from "@/src/services/workflow.service";
import {
  applicationUrl,
  emailConfigured,
  sendEmail,
} from "@/src/services/email.service";
import { hashPassword } from "@/src/services/password.service";
import { digest } from "@/src/services/auth-flow.service";
import { AppError } from "@/src/errors/AppError";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/src/services/session.service";

export const resetInput = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/\d/)
    .regex(/[^a-zA-Z0-9]/),
});
export class RecoveryController {
  static async request(request: NextRequest) {
    try {
      const { email } = z
        .object({
          email: z
            .email()
            .max(150)
            .transform((value) => value.toLowerCase()),
        })
        .parse(await request.json());
      if (!emailConfigured())
        throw new AppError(
          "A recuperação por e-mail ainda não está configurada.",
          503,
          "MAIL_NOT_CONFIGURED",
        );
      const user = await accountByEmail(email);
      if (user) {
        const token = randomBytes(32).toString("hex");
        const now = Date.now();
        const id = randomUUID();
        const created = await withWorkflow((records) => {
          for (let i = records.length - 1; i >= 0; i--)
            if (
              records[i].kind === "reset" &&
              Number(records[i].data.expires) <= now &&
              !(
                Number(records[i].data.revokedAt) >=
                now - SESSION_MAX_AGE * 1000
              )
            )
              records.splice(i, 1);
          if (
            records.some(
              (record) =>
                record.kind === "reset" &&
                record.ownerId === user.id &&
                Number(record.data.created) > now - 60_000,
            )
          )
            return false;
          records.push({
            id,
            kind: "reset",
            ownerId: user.id,
            data: {
              tokenHash: digest(token),
              passwordHash: digest(user.passwordHash),
              role: user.role,
              created: now,
              expires: now + 900_000,
              consumed: false,
            },
          });
          return true;
        }, true);
        if (created) {
          try {
            await sendEmail(
              email,
              "Redefina sua senha SmartFix",
              `Use este link em até 15 minutos: ${applicationUrl()}/redefinir-senha#token=${token}\nSe você não solicitou, ignore este e-mail.`,
              id,
            );
          } catch {
            console.error("Não foi possível enviar a recuperação de senha.");
          }
        }
      }
      return noStoreResponse(
        NextResponse.json({
          success: true,
          data: {},
          message:
            "Se a conta existir e o envio estiver disponível, você receberá um link. Aguarde pelo menos um minuto antes de tentar novamente.",
        }),
      );
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
  static async reset(request: NextRequest) {
    try {
      const input = resetInput.parse(await request.json());
      const tokenHash = digest(input.token);
      const record = await withWorkflow((records) =>
        records.find(
          (item) => item.kind === "reset" && item.data.tokenHash === tokenHash,
        ),
      );
      const invalid = () =>
        new AppError(
          "Link inválido ou expirado. Solicite outro.",
          422,
          "INVALID_RESET",
        );
      if (
        !record ||
        record.data.consumed ||
        Number(record.data.expires) <= Date.now()
      )
        throw invalid();
      const role = z.enum(["client", "partner"]).parse(record.data.role);
      const user = await accountById(record.ownerId, role);
      if (!user || digest(user.passwordHash) !== record.data.passwordHash)
        throw invalid();
      const passwordHash = await hashPassword(input.password);
      await withWorkflow((records) => {
        const current = records.find((item) => item.id === record.id);
        if (
          !current ||
          current.data.consumed ||
          Number(current.data.expires) <= Date.now()
        )
          throw invalid();
        current.data.consumed = true;
        current.data.revokedAt = Date.now();
      }, true);
      await changePassword(user.id, role, passwordHash, user.passwordHash);
      const response = noStoreResponse(
        NextResponse.json({ success: true, data: {} }),
      );
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        ...sessionCookieOptions,
        maxAge: 0,
      });
      return response;
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
}
