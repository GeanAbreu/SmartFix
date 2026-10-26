import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { Partner } from "@/src/models";
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

export class PartnerController {
  static async me(request: NextRequest) {
    try {
      const session = await requireSession(request);

      if (session.role !== "partner") {
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
        ? await findLocalUserById(session.sub)
        : (assertDatabaseConfigured(),
          await Partner.findByPk(session.sub, {
            attributes: [
              "id",
              "full_name",
              "email",
              "company_name",
              "phone",
              "is_verified",
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
      const session = await requireSession(request);
      if (session.role !== "partner") throw new AppError("Esta área é exclusiva para parceiros.", 403, "FORBIDDEN");
      const input = z.object({
        companyName: z.string().trim().min(3, "Informe o nome da assistência.").max(150),
        phone: z.string().trim().min(10, "Informe um telefone com DDD.").max(20).refine((value) => value.replace(/\D/g, "").length >= 10, "Informe um telefone com DDD."),
      }).parse(await request.json());
      if (usesLocalAuthStore()) await updateLocalPartnerProfile(session.sub, input);
      else {
        assertDatabaseConfigured();
        const [updated] = await Partner.update({ company_name: input.companyName, phone: input.phone }, { where: { id: session.sub } });
        if (!updated) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
      }
      return noStoreResponse(NextResponse.json({ success: true, data: { partner: input } }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
}
