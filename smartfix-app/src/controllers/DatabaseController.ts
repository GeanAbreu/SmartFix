import { NextResponse } from "next/server";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import {
  localAuthStoreStatus,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import { controllerErrorResponse } from "./controller.utils";

export class DatabaseController {
  static async health() {
    try {
      if (usesLocalAuthStore()) {
        const status = await localAuthStoreStatus();

        return NextResponse.json({
          success: true,
          message: "Armazenamento local disponível para desenvolvimento.",
          data: {
            database: "local",
            users: status.users,
          },
        });
      }

      assertDatabaseConfigured();
      await sequelize.authenticate();

      return NextResponse.json({
        success: true,
        message: "Conexão com o banco realizada com sucesso.",
        data: {
          database: "postgresql",
          orm: "sequelize",
        },
      });
    } catch (error) {
      return controllerErrorResponse(error);
    }
  }
}
