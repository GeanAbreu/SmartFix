import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  accountByEmail,
  accountById,
  actorFrom,
} from "@/src/services/account.service";
import { applicationUrl } from "@/src/services/email.service";
import { openFlow, sealFlow } from "@/src/services/auth-flow.service";
import { nextWorkflowId, withWorkflow } from "@/src/services/workflow.service";
import { AppError } from "@/src/errors/AppError";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/src/services/session.service";
import { noStoreResponse } from "./controller.utils";
const COOKIE = "smartfix_google_flow";
const options = {
  ...sessionCookieOptions,
  path: "/api/auth/google",
  maxAge: 600,
};
function errorPage(request: NextRequest, error: unknown) {
  const url = new URL("/login/google-status", request.url);
  url.searchParams.set(
    "error",
    error instanceof AppError ? error.code || "INVALID_OAUTH" : "INVALID_OAUTH",
  );
  return noStoreResponse(NextResponse.redirect(url));
}
function configured() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
    throw new AppError(
      "O login Google ainda não está configurado.",
      503,
      "GOOGLE_NOT_CONFIGURED",
    );
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callback: `${applicationUrl()}/api/auth/google/callback`,
  };
}
export class GoogleController {
  static async start(request: NextRequest) {
    try {
      const config = configured();
      const link = request.nextUrl.searchParams.get("link") === "true";
      const actor = link ? await actorFrom(request) : null;
      const state = randomBytes(32).toString("base64url");
      const verifier = randomBytes(32).toString("base64url");
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.callback,
        response_type: "code",
        scope: "openid email profile",
        state,
        code_challenge: createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
        prompt: "select_account",
      }).toString();
      const response = noStoreResponse(NextResponse.redirect(url));
      response.cookies.set(
        COOKIE,
        sealFlow({ state, verifier, actorId: actor?.sub, role: actor?.role }),
        options,
      );
      return response;
    } catch (error) {
      return errorPage(request, error);
    }
  }
  static async callback(request: NextRequest) {
    let response: NextResponse;
    try {
      const config = configured();
      const flow = openFlow(request.cookies.get(COOKIE)?.value || "");
      const code = request.nextUrl.searchParams.get("code");
      if (
        !flow ||
        flow.state !== request.nextUrl.searchParams.get("state") ||
        typeof flow.verifier !== "string" ||
        !code
      )
        throw new AppError(
          "Login Google inválido ou expirado.",
          400,
          "INVALID_OAUTH",
        );
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uri: config.callback,
          code,
          grant_type: "authorization_code",
          code_verifier: flow.verifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!tokenResponse.ok)
        throw new AppError(
          "Não foi possível autenticar no Google.",
          401,
          "INVALID_OAUTH",
        );
      const tokens = z
        .object({ access_token: z.string().min(1) })
        .parse(await tokenResponse.json());
      const userResponse = await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!userResponse.ok)
        throw new AppError(
          "Não foi possível verificar a conta Google.",
          401,
          "INVALID_OAUTH",
        );
      const google = z
        .object({
          sub: z.string().min(1),
          email: z.email(),
          email_verified: z.literal(true),
        })
        .parse(await userResponse.json());
      let identity;
      if (flow.actorId) {
        const actor = await actorFrom(request);
        if (actor.sub !== flow.actorId || actor.role !== flow.role)
          throw new AppError(
            "Entre novamente para vincular sua conta.",
            401,
            "INVALID_OAUTH",
          );
        identity = await withWorkflow((records) => {
          const existing = records.find(
            (item) =>
              item.kind === "google" && item.data.subject === google.sub,
          );
          if (
            existing &&
            (existing.ownerId !== actor.sub ||
              existing.data.role !== actor.role)
          )
            throw new AppError(
              "Esta conta Google já está vinculada.",
              409,
              "IDENTITY_IN_USE",
            );
          if (existing) return existing;
          const record = {
            id: nextWorkflowId(records),
            kind: "google" as const,
            ownerId: actor.sub,
            data: { subject: google.sub, role: actor.role },
          };
          records.push(record);
          return record;
        }, true);
      } else
        identity = await withWorkflow((records) =>
          records.find(
            (item) =>
              item.kind === "google" && item.data.subject === google.sub,
          ),
        );
      if (!identity) {
        const account = await accountByEmail(google.email.toLowerCase());
        if (!account)
          throw new AppError(
            "Cadastre-se com este e-mail antes do primeiro acesso com Google.",
            403,
            "GOOGLE_NOT_LINKED",
          );
        identity = await withWorkflow((records) => {
          const existing = records.find(
            (item) =>
              item.kind === "google" && item.data.subject === google.sub,
          );
          if (existing) return existing;
          const record = {
            id: nextWorkflowId(records),
            kind: "google" as const,
            ownerId: account.id,
            data: { subject: google.sub, role: account.role },
          };
          records.push(record);
          return record;
        }, true);
      }
      const role = z.enum(["client", "partner"]).parse(identity.data.role);
      const user = await accountById(identity.ownerId, role);
      if (!user)
        throw new AppError("Conta não encontrada.", 401, "INVALID_OAUTH");
      response = noStoreResponse(
        NextResponse.redirect(
          `${applicationUrl()}${role === "client" ? "/cliente/dashboard" : "/parceiro/dashboard"}`,
        ),
      );
      response.cookies.set(
        SESSION_COOKIE_NAME,
        createSessionToken({ sub: user.id, role }),
        sessionCookieOptions,
      );
    } catch (error) {
      response = errorPage(request, error);
    }
    response.cookies.set(COOKIE, "", { ...options, maxAge: 0 });
    return response;
  }
}
