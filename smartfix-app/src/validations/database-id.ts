import { z } from "zod";

// PostgreSQL BIGINT values are intentionally kept as strings in JavaScript to
// avoid precision loss once the sequence grows beyond Number.MAX_SAFE_INTEGER.
export const databaseId = z.string().regex(/^[1-9]\d*$/, "ID inválido.");

