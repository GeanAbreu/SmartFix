import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { Partner } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import {
  findLocalUserById,
  updateLocalPartnerProfile,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/src/services/session.service";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import { exchangeAuthorizationCode, mercadoPagoAuthorizationUrl, readOAuthState, savePartnerAuthorization } from "@/src/services/mercado-pago.service";

export class PartnerController {
  static async me(request: NextRequest) {
    try {
      const actor = await actorFrom(request);

      if (actor.role !== "partner") {
        return noStoreResponse(NextResponse.json(
          {
            success: false,
            message: "Esta área é exclusiva para parceiros.",
            redirectTo: "/cliente/dashboard",
          },
          { status: 403 }
        ));
      }

      const partner = usesLocalAuthStore()
        ? await findLocalUserById(actor.sub)
        : (assertDatabaseConfigured(),
          await Partner.findByPk(actor.sub, {
            attributes: [
              "id",
              "full_name",
              "email",
              "company_name",
              "phone",
              "is_verified",
              "mercado_pago_user_id",
            ],
          }));

      if (!partner || ("role" in partner && partner.role !== "partner")) {
        throw new AppError("Parceiro não encontrado.", 401, "UNAUTHENTICATED");
      }

      const isLocalPartner = "role" in partner;

      return noStoreResponse(NextResponse.json({
        success: true,
        data: {
          partner: {
            id: partner.id,
            name: isLocalPartner ? partner.name : partner.full_name,
            email: partner.email,
            companyName: isLocalPartner
              ? partner.companyName
              : partner.company_name,
            isVerified: isLocalPartner
              ? partner.isVerified
              : partner.is_verified,
            phone: isLocalPartner ? partner.phone : partner.phone,
            mercadoPagoConnected: isLocalPartner ? false : Boolean(partner.mercado_pago_user_id),
            mercadoPagoUserId: isLocalPartner ? null : partner.mercado_pago_user_id,
          },
        },
      }));
    } catch (error) {
      const response = controllerErrorResponse(error);

      if (error instanceof AppError && error.statusCode === 401) {
        response.cookies.set(SESSION_COOKIE_NAME, "", {
          ...sessionCookieOptions,
          maxAge: 0,
        });
      }

      return noStoreResponse(response);
    }
  }

  static async updateMe(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "partner") throw new AppError("Esta área é exclusiva para parceiros.", 403, "FORBIDDEN");
      const input = z.object({
        companyName: z.string().trim().min(3, "Informe o nome da assistência.").max(150),
        phone: z.string().trim().min(10, "Informe um telefone com DDD.").max(20).refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
      }).parse(await request.json());
      if (usesLocalAuthStore()) await updateLocalPartnerProfile(actor.sub, input);
      else {
        assertDatabaseConfigured();
        const [updated] = await Partner.update({ company_name: input.companyName, phone: input.phone }, { where: { id: actor.sub } });
        if (!updated) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
      }
      return noStoreResponse(NextResponse.json({ success: true, data: { partner: input } }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async connectMercadoPago(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "partner") throw new AppError("Esta área é exclusiva para parceiros.", 403, "FORBIDDEN");
      if (usesLocalAuthStore()) throw new AppError("A conexão com o Mercado Pago exige o banco de dados.", 503, "DATABASE_REQUIRED");
      return NextResponse.redirect(mercadoPagoAuthorizationUrl(actor.sub));
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }

  static async mercadoPagoCallback(request: NextRequest) {
    const target = new URL("/parceiro/perfil", request.nextUrl.origin);
    try {
      const actor = await actorFrom(request);
      const state = readOAuthState(z.string().min(20).parse(request.nextUrl.searchParams.get("state")));
      if (actor.role !== "partner" || actor.sub !== state.partnerId)
        throw new AppError("A autorização não pertence a esta conta.", 403, "FORBIDDEN");
      const credentials = await exchangeAuthorizationCode(
        z.string().min(5).parse(request.nextUrl.searchParams.get("code")), state.codeVerifier);
      await savePartnerAuthorization(actor.sub, credentials);
      target.searchParams.set("mercadoPago", "connected");
    } catch {
      target.searchParams.set("mercadoPago", "error");
    }
    return NextResponse.redirect(target);
  }
}
