import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { Partner } from "@/src/models";
import {
  findLocalUserById,
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
      const session = requireSession(request);

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
}
