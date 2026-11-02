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
const rejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false";

function getPoolMax() {
  const configuredValue = Number.parseInt(process.env.DB_POOL_MAX ?? "5", 10);

  if (!Number.isFinite(configuredValue) || configuredValue < 1) {
    return 5;
  }

  return Math.min(configuredValue, 20);
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
            ...(process.env.DB_SSL_CA_FILE
              ? { ca: readFileSync(process.env.DB_SSL_CA_FILE, "utf8") }
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
    return new Sequelize(databaseUrl, options);
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
