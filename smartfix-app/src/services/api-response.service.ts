import type { ApiResponse } from "@/src/types/api";

const AUTH_SERVICE_UNAVAILABLE =
  "O serviço de autenticação está temporariamente indisponível. Tente novamente em instantes.";

const AUTH_ROUTE_NOT_FOUND =
  "O serviço de autenticação não foi encontrado. Reinicie a aplicação pelo servidor da SmartFix e tente novamente.";

function responseErrorMessage(response: Response) {
  return response.status === 404
    ? AUTH_ROUTE_NOT_FOUND
    : AUTH_SERVICE_UNAVAILABLE;
}

export async function readApiResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(responseErrorMessage(response));
  }

  let data: unknown;

  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(responseErrorMessage(response));
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("success" in data) ||
    typeof data.success !== "boolean"
  ) {
    throw new Error(AUTH_SERVICE_UNAVAILABLE);
  }

  return data as ApiResponse<T>;
}
