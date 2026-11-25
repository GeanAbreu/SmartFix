import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { Partner } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import {
  findLocalUserById,
  updateLocalPartnerPixKey,
  updateLocalPartnerProfile,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/src/services/session.service";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import { withWorkflow } from "@/src/services/workflow.service";

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
              "pix_key",
              "business_hours",
              "avatar_url",
            ],
          }));

      if (!partner || ("role" in partner && partner.role !== "partner")) {
        throw new AppError("Parceiro não encontrado.", 401, "UNAUTHENTICATED");
      }

      const isLocalPartner = "role" in partner;
      const googleLinked = await withWorkflow((records) => records.some((item) => item.kind === "google" && item.ownerId === actor.sub && item.data.role === "partner"), false);

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
            pixKey: isLocalPartner ? partner.pixKey || null : partner.pix_key,
            businessHours: isLocalPartner ? partner.businessHours || null : partner.business_hours,
            avatarUrl: isLocalPartner ? partner.avatarUrl || null : partner.avatar_url,
            googleLinked,
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
        businessHours: z.string().trim().min(5, "Informe o horário de funcionamento.").max(300),
      }).parse(await request.json());
      if (usesLocalAuthStore()) await updateLocalPartnerProfile(actor.sub, input);
      else {
        assertDatabaseConfigured();
        const [updated] = await Partner.update({ company_name: input.companyName, phone: input.phone, business_hours: input.businessHours }, { where: { id: actor.sub } });
        if (!updated) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
      }
      return noStoreResponse(NextResponse.json({ success: true, data: { partner: input } }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async updatePixKey(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "partner") throw new AppError("Esta área é exclusiva para parceiros.", 403, "FORBIDDEN");
      const input = z.object({
        pixKey: z.string().trim().min(5, "Informe uma chave PIX válida.").max(150),
      }).parse(await request.json());
      if (usesLocalAuthStore()) await updateLocalPartnerPixKey(actor.sub, input.pixKey);
      else {
        const [updated] = await Partner.update({ pix_key: input.pixKey }, { where: { id: actor.sub } });
        if (!updated) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
      }
      return noStoreResponse(NextResponse.json({ success: true, data: input }));
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
