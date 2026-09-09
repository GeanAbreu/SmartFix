import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { Client } from "@/src/models";
import {
  findLocalUserById,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/src/services/session.service";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";
import { actorFrom } from "@/src/services/account.service";
import { profileInput } from "@/src/validations/profile.validation";
import { updateLocalProfile } from "@/src/services/local-auth.service";

export class ClientController {
  static async update(request: NextRequest) {
    try {
      const actor = await actorFrom(request);
      if (actor.role !== "client") throw new AppError("Área exclusiva de clientes.", 403, "FORBIDDEN");
      const input = profileInput.parse(await request.json());
      if (usesLocalAuthStore()) await updateLocalProfile(actor.sub, { name: input.nome, phone: input.telefone });
      else await Client.update(input, { where: { id: actor.sub } });
      return noStoreResponse(NextResponse.json({ success: true, data: {} }));
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
  static async me(request: NextRequest) {
    try {
      const session = await requireSession(request);

      if (session.role !== "client") {
        return noStoreResponse(NextResponse.json(
          {
            success: false,
            message: "Esta área é exclusiva para clientes.",
            redirectTo: "/parceiro/dashboard",
          },
          { status: 403 }
        ));
      }

      const client = usesLocalAuthStore()
        ? await findLocalUserById(session.sub)
        : (assertDatabaseConfigured(),
          await Client.findByPk(session.sub, {
            attributes: ["id", "nome", "email", "telefone", "cpf"],
          }));

      if (!client || ("role" in client && client.role !== "client")) {
        throw new AppError("Cliente não encontrado.", 401, "UNAUTHENTICATED");
      }

      const isLocalClient = "role" in client;

      return noStoreResponse(NextResponse.json({
        success: true,
        data: {
          client: {
            id: client.id,
            nome: isLocalClient ? client.name : client.nome,
            email: client.email,
            telefone: isLocalClient ? client.phone : client.telefone,
            cpf: isLocalClient ? client.document : client.cpf,
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
