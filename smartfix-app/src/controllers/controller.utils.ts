import { NextResponse } from "next/server";
import {
  ConnectionError,
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} from "sequelize";
import { ZodError } from "zod";
import { AppError } from "@/src/errors/AppError";

export function noStoreResponse(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export function controllerErrorResponse(error: unknown) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        message: "O corpo da requisição deve conter JSON válido.",
      },
      { status: 400 }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: error.issues[0]?.message ?? "Dados inválidos.",
        errors: error.flatten().fieldErrors,
      },
      { status: 422 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof UniqueConstraintError) {
    return NextResponse.json(
      {
        success: false,
        message: "Já existe um cadastro com um dos dados informados.",
      },
      { status: 409 }
    );
  }

  if (error instanceof ForeignKeyConstraintError) {
    return NextResponse.json({ success: false, code: "RELATED_RECORD_CONFLICT",
      message: "A operação conflita com registros vinculados. Atualize a página e confira os vínculos." }, { status: 409 });
  }

  if (error instanceof ConnectionError) {
    console.error("Banco de dados SmartFix indisponível:", error.name);
    return NextResponse.json({ success: false, code: "DATABASE_UNAVAILABLE",
      message: "O serviço de mensagens está temporariamente indisponível. Tente novamente em instantes." }, { status: 503 });
  }

  if (error instanceof DatabaseError) {
    const code = (error.parent as Error & { code?: string }).code;
    console.error("Falha de esquema no banco SmartFix:", code ?? error.name);
    if (code === "42P01" || code === "42703") {
      return NextResponse.json({ success: false, code: "DATABASE_SCHEMA_OUTDATED",
        message: "O serviço de mensagens precisa de uma atualização do banco de dados." }, { status: 503 });
    }
  }

  console.error("Erro interno SmartFix:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Erro interno do servidor.",
    },
    { status: 500 }
  );
}
