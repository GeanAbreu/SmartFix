import bcrypt from "bcryptjs";
import { timingSafeEqual } from "node:crypto";

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  storedPassword: string
) {
  if (BCRYPT_HASH.test(storedPassword)) {
    try {
      return await bcrypt.compare(password, storedPassword);
    } catch {
      return false;
    }
  }

  // Compatibilidade temporária com registros antigos que ainda possuem senha em texto puro.
  const received = Buffer.from(password, "utf8");
  const stored = Buffer.from(storedPassword, "utf8");

  return received.length === stored.length && timingSafeEqual(received, stored);
}

export function passwordNeedsRehash(storedPassword: string) {
  if (!BCRYPT_HASH.test(storedPassword)) {
    return true;
  }

  try {
    return bcrypt.getRounds(storedPassword) < BCRYPT_ROUNDS;
  } catch {
    return true;
  }
}
