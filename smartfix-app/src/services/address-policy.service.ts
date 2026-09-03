import { AppError } from "@/src/errors/AppError";

export function assertAddressCanBeDeleted(principal: boolean, addressCount: number) {
  if (principal) {
    throw new AppError(
      "O endereço principal não pode ser excluído. Defina outro endereço como principal primeiro.",
      409,
      "PRIMARY_ADDRESS_CANNOT_BE_DELETED"
    );
  }

  if (addressCount <= 1) {
    throw new AppError(
      "Você precisa manter pelo menos um endereço cadastrado.",
      409,
      "LAST_ADDRESS_CANNOT_BE_DELETED"
    );
  }
}
