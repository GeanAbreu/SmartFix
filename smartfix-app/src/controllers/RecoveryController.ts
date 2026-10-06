import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { accountByEmail, accountById, changePassword } from "@/src/services/account.service";
import { withWorkflow } from "@/src/services/workflow.service";
import { emailConfigured, recoveryCodeEmail, sendEmail } from "@/src/services/email.service";
import { hashPassword } from "@/src/services/password.service";
import { digest } from "@/src/services/auth-flow.service";
import { AppError } from "@/src/errors/AppError";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, sessionCookieOptions } from "@/src/services/session.service";

const emailInput = z.string().trim().toLowerCase().email().max(150);
export const recoveryCodeInput = z.object({
  email: emailInput,
  code: z.string().trim().regex(/^\d{6}$/, "Informe o código de 6 dígitos."),
});
export const resetInput = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  password: z.string().min(8).max(128).regex(/\d/).regex(/[^a-zA-Z0-9]/),
});

const invalidCode = () => new AppError(
  "Código incorreto ou expirado. Confira o e-mail e tente novamente.", 422, "INVALID_RECOVERY_CODE",
);
const invalidReset = () => new AppError(
  "A autorização para alterar a senha é inválida ou expirou. Solicite outro código.", 422, "INVALID_RESET",
);

export class RecoveryController {
  static async request(request: NextRequest) {
    try {
      const { email } = z.object({ email: emailInput }).parse(await request.json());
      if (!emailConfigured())
        throw new AppError("A recuperação por e-mail ainda não está configurada.", 503, "MAIL_NOT_CONFIGURED");

      const user = await accountByEmail(email);
      if (user) {
        const now = Date.now();
        const id = randomUUID();
        const code = await withWorkflow((records) => {
          for (let index = records.length - 1; index >= 0; index--)
            if (records[index].kind === "reset" && Number(records[index].data.expires) <= now &&
              !(Number(records[index].data.revokedAt) >= now - SESSION_MAX_AGE * 1000))
              records.splice(index, 1);
          if (records.some((record) => record.kind === "reset" && record.ownerId === user.id &&
            Number(record.data.created) > now - 60_000)) return null;
          let generated: string;
          do {
            generated = randomInt(0, 1_000_000).toString().padStart(6, "0");
          } while (records.some((record) => record.kind === "reset" && !record.data.consumed &&
            Number(record.data.expires) > now && record.data.codeHash === digest(generated)));
          records.push({
            id, kind: "reset", ownerId: user.id,
            data: {
              codeHash: digest(generated), passwordHash: digest(user.passwordHash), role: user.role,
              created: now, expires: now + 900_000, attempts: 0, consumed: false,
            },
          });
          return generated;
        }, true);
        if (!code)
          throw new AppError(
            "Aguarde 60 segundos antes de solicitar outro código.",
            429,
            "RECOVERY_RATE_LIMITED",
          );
        if (code) {
          try {
            const content = recoveryCodeEmail(code);
            await sendEmail(
              email,
              "Código de recuperação SmartFix",
              content.text,
              id,
              content.html,
            );
          } catch (error) {
            await withWorkflow((records) => {
              const index = records.findIndex((record) => record.id === id);
              if (index >= 0) records.splice(index, 1);
            }, true);
            console.error("Não foi possível enviar o código de recuperação de senha.");
            if (error instanceof AppError) throw error;
            throw new AppError(
              "Não foi possível enviar o código por e-mail. Tente novamente.",
              502,
              "MAIL_DELIVERY_FAILED",
            );
          }
        }
      }
      return noStoreResponse(NextResponse.json({
        success: true, data: {},
        message: "Se o e-mail estiver cadastrado, enviaremos um código de 6 dígitos.",
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async verifyCode(request: NextRequest) {
    try {
      const input = recoveryCodeInput.parse(await request.json());
      const user = await accountByEmail(input.email);
      if (!user) throw invalidCode();
      const now = Date.now();
      const resetToken = randomBytes(32).toString("hex");
      const verified = await withWorkflow((records) => {
        const record = records
          .filter((item) => item.kind === "reset" && item.ownerId === user.id)
          .sort((a, b) => Number(b.data.created) - Number(a.data.created))[0];
        if (!record || record.data.consumed || Number(record.data.expires) <= now ||
          Number(record.data.attempts || 0) >= 5) return false;
        if (record.data.codeHash !== digest(input.code)) {
          record.data.attempts = Number(record.data.attempts || 0) + 1;
          return false;
        }
        record.data.resetTokenHash = digest(resetToken);
        record.data.verifiedAt = now;
        record.data.expires = Math.min(Number(record.data.expires), now + 600_000);
        return true;
      }, true);
      if (!verified) throw invalidCode();
      return noStoreResponse(NextResponse.json({ success: true, data: { token: resetToken } }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async reset(request: NextRequest) {
    try {
      const input = resetInput.parse(await request.json());
      const tokenHash = digest(input.token);
      const record = await withWorkflow((records) => records.find(
        (item) => item.kind === "reset" && item.data.resetTokenHash === tokenHash,
      ));
      if (!record || record.data.consumed || Number(record.data.expires) <= Date.now() || !record.data.verifiedAt)
        throw invalidReset();
      const role = z.enum(["client", "partner"]).parse(record.data.role);
      const user = await accountById(record.ownerId, role);
      if (!user || digest(user.passwordHash) !== record.data.passwordHash) throw invalidReset();
      const passwordHash = await hashPassword(input.password);
      await withWorkflow((records) => {
        const current = records.find((item) => item.id === record.id);
        if (!current || current.data.consumed || Number(current.data.expires) <= Date.now() ||
          current.data.resetTokenHash !== tokenHash) throw invalidReset();
        current.data.consumed = true;
        current.data.revokedAt = Date.now();
        delete current.data.codeHash;
        delete current.data.resetTokenHash;
      }, true);
      await changePassword(user.id, role, passwordHash, user.passwordHash);
      const response = noStoreResponse(NextResponse.json({ success: true, data: {} }));
      response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0 });
      return response;
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
}
