import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { AppError } from "@/src/errors/AppError";
import { assertAddressCanBeDeleted } from "@/src/services/address-policy.service";
import type { SessionRole } from "@/src/types/api";
import type { WorkflowRecord } from "@/src/types/workflow";

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

export type LocalClientAddress = {
  id: string;
  clientId: string;
  apelido: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
};

export type LocalClientDevice = {
  id: string;
  clientId: string;
  tipo: string;
  marca: string;
  modelo: string;
  fotoUrl: string;
  apelido?: string;
  numeroSerie?: string;
};

type LocalAuthStore = {
  version: 1;
  users: LocalAuthUser[];
  addresses?: LocalClientAddress[];
  devices?: LocalClientDevice[];
  workflow?: WorkflowRecord[];
};

type CreateLocalUserInput = Omit<LocalAuthUser, "id" | "createdAt" | "isVerified">;
type CreateLocalAddressInput = Omit<LocalClientAddress, "id" | "clientId" | "principal">;

const dataDirectory = process.env.NODE_ENV === "development" && process.env.SMARTFIX_LOCAL_DATA_DIR
  ? path.resolve(process.env.SMARTFIX_LOCAL_DATA_DIR)
  : path.join(process.cwd(), ".smartfix-data");
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

export function localWorkflow<T>(operation: (records: WorkflowRecord[]) => Promise<T> | T, write: boolean) {
  return withStore((store) => { store.workflow ??= []; return operation(store.workflow); }, write);
}

export function updateLocalProfile(id: string, input: { name: string; phone: string }) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.id === id);
    if (!user) throw new AppError("Usuário não encontrado.", 404, "NOT_FOUND");
    user.name = input.name; user.phone = input.phone;
  }, true);
}

export function listLocalPartners() {
  return withStore((store) => store.users.filter((user) => user.role === "partner").map((user) => ({
    id: user.id, name: user.companyName || user.name, email: user.email, document: user.document, isVerified: user.isVerified,
  })));
}

export function verifyLocalPartner(id: string, verified: boolean, notification?: WorkflowRecord) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.id === id && candidate.role === "partner");
    if (!user) throw new AppError("Parceiro não encontrado.", 404, "NOT_FOUND");
    user.isVerified = verified;
    if (notification) { store.workflow ??= []; store.workflow.push(notification); }
  }, true);
}

export function createLocalUser(
  input: CreateLocalUserInput,
  initialAddress?: CreateLocalAddressInput
) {
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

    if (user.role === "client" && initialAddress) {
      localAddresses(store).push({
        ...initialAddress,
        id: randomUUID(),
        clientId: user.id,
        principal: true,
      });
    }

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

export function updateLocalPassword(id: string, passwordHash: string, expectedHash?: string) {
  return withStore((store) => {
    const user = store.users.find((candidate) => candidate.id === id);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 401, "UNAUTHENTICATED");
    }

    if (expectedHash !== undefined && user.passwordHash !== expectedHash) throw new AppError("Link inválido. Solicite outro.", 422, "INVALID_RESET");
    user.passwordHash = passwordHash;
  }, true);
}

export function localAuthStoreStatus() {
  return withStore((store) => ({ users: store.users.length }));
}

function localAddresses(store: LocalAuthStore) {
  store.addresses ??= [];
  return store.addresses;
}

export function listLocalAddresses(clientId: string) {
  return withStore((store) =>
    localAddresses(store)
      .filter((address) => address.clientId === clientId)
      .sort((a, b) => Number(b.principal) - Number(a.principal))
      .map((address) => ({ ...address }))
  );
}

export function createLocalAddress(
  clientId: string,
  input: Omit<LocalClientAddress, "id" | "clientId">
) {
  return withStore((store) => {
    const addresses = localAddresses(store);
    const clientAddresses = addresses.filter((address) => address.clientId === clientId);
    const principal = input.principal || clientAddresses.length === 0;

    if (principal) {
      clientAddresses.forEach((address) => {
        address.principal = false;
      });
    }

    const address: LocalClientAddress = {
      ...input,
      id: randomUUID(),
      clientId,
      principal,
    };
    addresses.push(address);
    return { ...address };
  }, true);
}

export function updateLocalAddress(
  clientId: string,
  addressId: string,
  input: Omit<LocalClientAddress, "id" | "clientId">
) {
  return withStore((store) => {
    const addresses = localAddresses(store);
    const address = addresses.find(
      (candidate) => candidate.id === addressId && candidate.clientId === clientId
    );

    if (!address) {
      throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
    }

    if (input.principal) {
      addresses.forEach((candidate) => {
        if (candidate.clientId === clientId) candidate.principal = false;
      });
    }

    Object.assign(address, {
      ...input,
      principal: address.principal || input.principal,
    });
    return { ...address };
  }, true);
}

export function deleteLocalAddress(clientId: string, addressId: string) {
  return withStore((store) => {
    const addresses = localAddresses(store);
    const index = addresses.findIndex(
      (candidate) => candidate.id === addressId && candidate.clientId === clientId
    );

    if (index < 0) {
      throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
    }

    const clientAddressCount = addresses.filter(
      (candidate) => candidate.clientId === clientId
    ).length;
    assertAddressCanBeDeleted(addresses[index].principal, clientAddressCount);
    addresses.splice(index, 1);
  }, true);
}

export function setLocalPrimaryAddress(clientId: string, addressId: string) {
  return withStore((store) => {
    const addresses = localAddresses(store);
    const address = addresses.find(
      (candidate) => candidate.id === addressId && candidate.clientId === clientId
    );

    if (!address) {
      throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
    }

    addresses.forEach((candidate) => {
      if (candidate.clientId === clientId) candidate.principal = candidate.id === addressId;
    });
    return { ...address, principal: true };
  }, true);
}

function localDevices(store: LocalAuthStore) {
  store.devices ??= [];
  return store.devices;
}

export function listLocalDevices(clientId: string) {
  return withStore((store) =>
    localDevices(store)
      .filter((device) => device.clientId === clientId)
      .map((device) => ({ ...device }))
  );
}

export function createLocalDevice(
  clientId: string,
  input: Omit<LocalClientDevice, "id" | "clientId">
) {
  return withStore((store) => {
    const device: LocalClientDevice = {
      ...input,
      id: randomUUID(),
      clientId,
    };
    localDevices(store).push(device);
    return { ...device };
  }, true);
}

export function updateLocalDevice(
  clientId: string,
  deviceId: string,
  input: Omit<LocalClientDevice, "id" | "clientId">
) {
  return withStore((store) => {
    const device = localDevices(store).find(
      (candidate) => candidate.id === deviceId && candidate.clientId === clientId
    );

    if (!device) {
      throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
    }

    Object.assign(device, input);
    return { ...device };
  }, true);
}

export function deleteLocalDevice(clientId: string, deviceId: string) {
  return withStore((store) => {
    const devices = localDevices(store);
    const index = devices.findIndex(
      (candidate) => candidate.id === deviceId && candidate.clientId === clientId
    );

    if (index < 0) {
      throw new AppError("Dispositivo não encontrado.", 404, "DEVICE_NOT_FOUND");
    }

    devices.splice(index, 1);
  }, true);
}
