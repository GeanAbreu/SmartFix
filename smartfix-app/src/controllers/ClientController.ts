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

export class ClientController {
  static async me(request: NextRequest) {
    try {
      const session = requireSession(request);

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
