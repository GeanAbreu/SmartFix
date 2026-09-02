import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@/src/errors/AppError";
import type { SessionRole } from "@/src/types/api";

export type LocalAuthUser = {
  id: string;
  role: SessionRole;
  name: string;
  email: string;
  passwordHash: string;
  document: string;
  phone: string;
  birthDate: string | null;
  companyName: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  isVerified: boolean;
  createdAt: string;
};

type LocalAuthStore = {
  version: 1;
  users: LocalAuthUser[];
};

type CreateLocalUserInput = Omit<LocalAuthUser, "id" | "createdAt" | "isVerified">;

const dataDirectory = path.join(process.cwd(), ".smartfix-data");
const dataFile = path.join(dataDirectory, "auth.json");

const globalForLocalAuth = globalThis as unknown as {
  smartfixLocalAuthQueue?: Promise<void>;
};

export function usesLocalAuthStore() {
  return process.env.NODE_ENV === "development" && !process.env.DATABASE_URL;
}

function emptyStore(): LocalAuthStore {
  return { version: 1, users: [] };
}

function isLocalAuthStore(value: unknown): value is LocalAuthStore {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { version?: unknown; users?: unknown };
  return candidate.version === 1 && Array.isArray(candidate.users);
}

async function readStore() {
  try {
    const contents = await readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(contents);

    if (!isLocalAuthStore(parsed)) {
      throw new Error("Formato de armazenamento local inválido.");
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyStore();
    }

    console.error("Erro ao abrir armazenamento local da SmartFix:", error);
    throw new AppError(
      "Não foi possível acessar os dados locais da SmartFix.",
      500,
      "LOCAL_STORE_UNAVAILABLE"
    );
  }
}

async function saveStore(store: LocalAuthStore) {
  await mkdir(dataDirectory, { recursive: true });

  const temporaryFile = `${dataFile}.${process.pid}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryFile, dataFile);
}

function withStore<T>(
  operation: (store: LocalAuthStore) => Promise<T> | T,
  persist = false
) {
  const previous = globalForLocalAuth.smartfixLocalAuthQueue ?? Promise.resolve();

  const current = previous.then(async () => {
    const store = await readStore();
    const result = await operation(store);

    if (persist) {
      await saveStore(store);
    }

    return result;
  });

  globalForLocalAuth.smartfixLocalAuthQueue = current.then(
    () => undefined,
    () => undefined
  );

  return current;
}

export function createLocalUser(input: CreateLocalUserInput) {
  return withStore((store) => {
    const normalizedEmail = input.email.toLowerCase();

    if (store.users.some((user) => user.email === normalizedEmail)) {
      throw new AppError("Este e-mail já está cadastrado.", 409, "EMAIL_IN_USE");
    }

    const duplicateDocument = store.users.some(
      (user) => user.role === input.role && user.document === input.document
    );

    if (duplicateDocument) {
      throw new AppError(
        input.role === "client"
          ? "Este CPF já está cadastrado."
          : "Este CNPJ já está cadastrado.",
        409,
        input.role === "client" ? "CPF_IN_USE" : "CNPJ_IN_USE"
      );
    }

    const user: LocalAuthUser = {
      ...input,
      id: randomUUID(),
      email: normalizedEmail,
      isVerified: false,
      createdAt: new Date().toISOString(),
    };

    store.users.push(user);
    return { ...user };
  }, true);
}

export function findLocalUserByEmail(email: string) {
  return withStore((store) => {
    const user = store.users.find(
      (candidate) => candidate.email === email.toLowerCase()
    );
    return user ? { ...user } : null;
  });
}

export function findLocalUserByDocument(document: string) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.document === document);
    return user ? { ...user } : null;
  });
}

export function findLocalUserById(id: string) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.id === id);
    return user ? { ...user } : null;
  });
}

export function updateLocalPassword(id: string, passwordHash: string) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.id === id);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
    }

    user.passwordHash = passwordHash;
  }, true);
}

export function localAuthStoreStatus() {
  return withStore((store) => ({ users: store.users.length }));
}
