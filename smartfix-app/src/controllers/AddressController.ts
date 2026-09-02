import { NextRequest, NextResponse } from "next/server";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { requireSession } from "@/src/middlewares/auth.middleware";
import { ClientAddress } from "@/src/models";
import {
  createLocalAddress,
  deleteLocalAddress,
  listLocalAddresses,
  setLocalPrimaryAddress,
  updateLocalAddress,
  usesLocalAuthStore,
} from "@/src/services/local-auth.service";
import { addressInputSchema, type AddressInput } from "@/src/validations/address.validation";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

function clientIdFrom(request: NextRequest) {
  const session = requireSession(request);
  if (session.role !== "client") {
    throw new AppError("Esta área é exclusiva para clientes.", 403, "FORBIDDEN");
  }
  return session.sub;
}

function normalize(input: AddressInput) {
  return {
    ...input,
    cep: input.cep.replace(/\D/g, ""),
    complemento: input.complemento || "",
  };
}

function serialize(address: ClientAddress) {
  return {
    id: address.id,
    apelido: address.apelido,
    cep: address.cep,
    logradouro: address.logradouro,
    numero: address.numero,
    complemento: address.complemento,
    bairro: address.bairro,
    cidade: address.cidade,
    estado: address.estado,
    principal: address.principal,
  };
}

export class AddressController {
  static async list(request: NextRequest) {
    try {
      const clientId = clientIdFrom(request);
      const addresses = usesLocalAuthStore()
        ? await listLocalAddresses(clientId)
        : (assertDatabaseConfigured(), await ClientAddress.findAll({
            where: { client_id: clientId },
            order: [["principal", "DESC"], ["apelido", "ASC"]],
          }));
      return noStoreResponse(NextResponse.json({
        success: true,
        data: { addresses: addresses.map((address) =>
          address instanceof ClientAddress ? serialize(address) : {
            id: address.id,
            apelido: address.apelido,
            cep: address.cep,
            logradouro: address.logradouro,
            numero: address.numero,
            complemento: address.complemento,
            bairro: address.bairro,
            cidade: address.cidade,
            estado: address.estado,
            principal: address.principal,
          }) },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async create(request: NextRequest) {
    try {
      const clientId = clientIdFrom(request);
      const input = normalize(addressInputSchema.parse(await request.json()));
      let address;
      if (usesLocalAuthStore()) {
        address = await createLocalAddress(clientId, input);
      } else {
        assertDatabaseConfigured();
        address = await sequelize.transaction(async (transaction) => {
          const count = await ClientAddress.count({ where: { client_id: clientId }, transaction });
          const principal = input.principal || count === 0;
          if (principal) {
            await ClientAddress.update({ principal: false }, { where: { client_id: clientId }, transaction });
          }
          return ClientAddress.create({ ...input, client_id: clientId, principal }, { transaction });
        });
      }
      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Endereço cadastrado com sucesso.",
        data: { address: address instanceof ClientAddress ? serialize(address) : address },
      }, { status: 201 }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async update(request: NextRequest, addressId: string) {
    try {
      const clientId = clientIdFrom(request);
      const input = normalize(addressInputSchema.parse(await request.json()));
      let address;
      if (usesLocalAuthStore()) {
        address = await updateLocalAddress(clientId, addressId, input);
      } else {
        assertDatabaseConfigured();
        address = await sequelize.transaction(async (transaction) => {
          const existing = await ClientAddress.findOne({ where: { id: addressId, client_id: clientId }, transaction });
          if (!existing) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
          if (input.principal) {
            await ClientAddress.update({ principal: false }, { where: { client_id: clientId }, transaction });
          }
          return existing.update({
            ...input,
            principal: existing.principal || input.principal,
          }, { transaction });
        });
      }
      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Endereço atualizado com sucesso.",
        data: { address: address instanceof ClientAddress ? serialize(address) : address },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async remove(request: NextRequest, addressId: string) {
    try {
      const clientId = clientIdFrom(request);
      if (usesLocalAuthStore()) {
        await deleteLocalAddress(clientId, addressId);
      } else {
        assertDatabaseConfigured();
        await sequelize.transaction(async (transaction) => {
          const address = await ClientAddress.findOne({ where: { id: addressId, client_id: clientId }, transaction });
          if (!address) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
          const wasPrimary = address.principal;
          await address.destroy({ transaction });
          if (wasPrimary) {
            const replacement = await ClientAddress.findOne({ where: { client_id: clientId }, transaction });
            if (replacement) await replacement.update({ principal: true }, { transaction });
          }
        });
      }
      return noStoreResponse(NextResponse.json({ success: true, message: "Endereço excluído com sucesso.", data: {} }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }

  static async setPrimary(request: NextRequest, addressId: string) {
    try {
      const clientId = clientIdFrom(request);
      let address;
      if (usesLocalAuthStore()) {
        address = await setLocalPrimaryAddress(clientId, addressId);
      } else {
        assertDatabaseConfigured();
        address = await sequelize.transaction(async (transaction) => {
          const existing = await ClientAddress.findOne({ where: { id: addressId, client_id: clientId }, transaction });
          if (!existing) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND");
          await ClientAddress.update({ principal: false }, { where: { client_id: clientId }, transaction });
          return existing.update({ principal: true }, { transaction });
        });
      }
      return noStoreResponse(NextResponse.json({
        success: true,
        message: "Endereço definido como principal.",
        data: { address: address instanceof ClientAddress ? serialize(address) : address },
      }));
    } catch (error) {
      return noStoreResponse(controllerErrorResponse(error));
    }
  }
}
