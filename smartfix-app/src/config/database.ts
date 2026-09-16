import { Sequelize } from "sequelize";
import { readFileSync } from "node:fs";
import { AppError } from "@/src/errors/AppError";

const databaseUrl = process.env.DATABASE_URL?.trim();
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
  if (!process.env.DATABASE_URL?.trim()) {
    throw new AppError(
      "Banco de dados não configurado. Defina DATABASE_URL no ambiente do servidor e reinicie a aplicação.",
      503,
      "DATABASE_NOT_CONFIGURED"
    );
  }
}

function createSequelizeInstance() {
  const options = {
    dialect: "postgres",
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
