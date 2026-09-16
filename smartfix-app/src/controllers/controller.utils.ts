import { NextResponse } from "next/server";
import { ForeignKeyConstraintError, UniqueConstraintError } from "sequelize";
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

  console.error("Erro interno SmartFix:", error);

  return NextResponse.json(
    {
      success: false,
      message: "Erro interno do servidor.",
    },
    { status: 500 }
  );
}
