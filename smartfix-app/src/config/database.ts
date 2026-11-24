import { Sequelize } from "sequelize";
import pg from "pg";
import { readFileSync } from "node:fs";
import { AppError } from "@/src/errors/AppError";

function configuredDatabaseUrl() {
  return (
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_PRISMA_URL?.trim()
  );
}

const databaseUrl = configuredDatabaseUrl();
const useSsl = process.env.DB_SSL !== "false";
const usesVercelManagedPostgresUrl =
  !process.env.DATABASE_URL?.trim() && Boolean(process.env.POSTGRES_URL?.trim());
const rejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";
const sslCaFile =
  process.env.DB_SSL_CA_FILE ||
  (usesVercelManagedPostgresUrl ? "certs/prod-ca-2021.crt" : undefined);

export function databaseUrlWithDriverSsl(value: string) {
  const url = new URL(value);
  // Supabase's session pooler (5432) has a small, fixed client limit and is
  // unsuitable for Vercel's horizontally scaled functions. The transaction
  // pooler uses the same credentials and database through port 6543.
  if (
    process.env.VERCEL === "1" &&
    url.hostname.endsWith(".pooler.supabase.com") &&
    (url.port === "" || url.port === "5432")
  ) {
    url.port = "6543";
  }
  if (!useSsl) return url.toString();
  // O pg converte sslmode da connection string em uma nova configuração SSL,
  // substituindo o CA fornecido em dialectOptions. A aplicação já configura
  // SSL explicitamente abaixo, portanto removemos apenas essa duplicidade.
  url.searchParams.delete("sslmode");
  url.searchParams.delete("uselibpqcompat");
  return url.toString();
}

export function getPoolMax() {
  const configuredValue = Number.parseInt(process.env.DB_POOL_MAX ?? "5", 10);
  const serverlessLimit = process.env.VERCEL === "1" ? 1 : 20;

  if (!Number.isFinite(configuredValue) || configuredValue < 1) {
    return Math.min(5, serverlessLimit);
  }

  // A Vercel cria várias instâncias da aplicação. Um pool grande por
  // instância multiplica rapidamente as conexões e esgota o limite do
  // Supabase session pooler (EMAXCONNSESSION).
  return Math.min(configuredValue, serverlessLimit);
}

export function assertDatabaseConfigured() {
  if (!configuredDatabaseUrl()) {
    throw new AppError(
      "Banco de dados não configurado. Defina DATABASE_URL ou POSTGRES_URL no ambiente do servidor e reinicie a aplicação.",
      503,
      "DATABASE_NOT_CONFIGURED"
    );
  }
}

function createSequelizeInstance() {
  const options = {
    dialect: "postgres",
    // Evita o carregamento dinâmico do driver pelo Sequelize. Além de tornar
    // a dependência explícita, isto garante que o pg entre no bundle Vercel.
    dialectModule: pg,
    logging:
      process.env.NODE_ENV === "development" &&
      process.env.DB_LOGGING === "true"
        ? console.debug
        : false,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized,
            ...(sslCaFile
              ? { ca: readFileSync(sslCaFile, "utf8") }
              : {}),
          },
        }
      : undefined,
    pool: {
      max: getPoolMax(),
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
  } as const;

  if (databaseUrl) {
    return new Sequelize(databaseUrlWithDriverSsl(databaseUrl), options);
  }

  // Instância inerte para permitir build sem segredos. Toda operação HTTP
  // chama assertDatabaseConfigured antes de tentar acessar o banco.
  return new Sequelize("smartfix_unconfigured", "smartfix_unconfigured", "", {
    ...options,
    host: "127.0.0.1",
  });
}

const globalForSequelize = globalThis as unknown as {
  smartfixSequelize?: Sequelize;
};

const sequelize =
  globalForSequelize.smartfixSequelize ?? createSequelizeInstance();

if (process.env.NODE_ENV !== "production") {
  globalForSequelize.smartfixSequelize = sequelize;
}

export default sequelize;
