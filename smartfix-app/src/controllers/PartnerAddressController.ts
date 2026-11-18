import { NextRequest, NextResponse } from "next/server";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { AppError } from "@/src/errors/AppError";
import { ClientAddress } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import { assertAddressCanBeDeleted } from "@/src/services/address-policy.service";
import { createLocalPartnerAddress, deleteLocalPartnerAddress, listLocalOwnerAddresses, setLocalPrimaryPartnerAddress, updateLocalPartnerAddress, usesLocalAuthStore } from "@/src/services/local-auth.service";
import { addressInputSchema, type AddressInput } from "@/src/validations/address.validation";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

async function partnerIdFrom(request: NextRequest) {
  const actor = await actorFrom(request);
  if (actor.role !== "partner") throw new AppError("Esta área é exclusiva para parceiros.", 403, "FORBIDDEN");
  return actor.sub;
}
const normalize = (input: AddressInput) => ({ ...input, cep: input.cep.replace(/\D/g, ""), complemento: input.complemento || "" });
const serialize = (address: ClientAddress) => ({ id: address.id, apelido: address.apelido, cep: address.cep, logradouro: address.logradouro, numero: address.numero, complemento: address.complemento, bairro: address.bairro, cidade: address.cidade, estado: address.estado, principal: address.principal });
const response = (address: ClientAddress | object, message: string, status = 200) => noStoreResponse(NextResponse.json({ success: true, message, data: { address: address instanceof ClientAddress ? serialize(address) : address } }, { status }));

export class PartnerAddressController {
  static async list(request: NextRequest) { try {
    const partnerId = await partnerIdFrom(request);
    const addresses = usesLocalAuthStore() ? await listLocalOwnerAddresses(partnerId, "partner") : (assertDatabaseConfigured(), await ClientAddress.findAll({ where: { partner_id: partnerId }, order: [["principal", "DESC"], ["apelido", "ASC"]] }));
    return noStoreResponse(NextResponse.json({ success: true, data: { addresses: addresses.map((address) => address instanceof ClientAddress ? serialize(address) : address) } }));
  } catch (error) { return noStoreResponse(controllerErrorResponse(error)); } }

  static async create(request: NextRequest) { try {
    const partnerId = await partnerIdFrom(request); const input = normalize(addressInputSchema.parse(await request.json())); let address;
    if (usesLocalAuthStore()) address = await createLocalPartnerAddress(partnerId, input);
    else { assertDatabaseConfigured(); address = await sequelize.transaction(async (transaction) => { const count = await ClientAddress.count({ where: { partner_id: partnerId }, transaction }); const principal = input.principal || count === 0; if (principal) await ClientAddress.update({ principal: false }, { where: { partner_id: partnerId }, transaction }); return ClientAddress.create({ ...input, partner_id: partnerId, client_id: null, principal }, { transaction }); }); }
    return response(address, "Endereço da loja cadastrado.", 201);
  } catch (error) { return noStoreResponse(controllerErrorResponse(error)); } }

  static async update(request: NextRequest, addressId: string) { try {
    const partnerId = await partnerIdFrom(request); const input = normalize(addressInputSchema.parse(await request.json())); let address;
    if (usesLocalAuthStore()) address = await updateLocalPartnerAddress(partnerId, addressId, input);
    else { assertDatabaseConfigured(); address = await sequelize.transaction(async (transaction) => { const existing = await ClientAddress.findOne({ where: { id: addressId, partner_id: partnerId }, transaction }); if (!existing) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND"); if (input.principal) await ClientAddress.update({ principal: false }, { where: { partner_id: partnerId }, transaction }); return existing.update({ ...input, principal: existing.principal || input.principal }, { transaction }); }); }
    return response(address, "Endereço da loja atualizado.");
  } catch (error) { return noStoreResponse(controllerErrorResponse(error)); } }

  static async remove(request: NextRequest, addressId: string) { try {
    const partnerId = await partnerIdFrom(request);
    if (usesLocalAuthStore()) await deleteLocalPartnerAddress(partnerId, addressId); else { assertDatabaseConfigured(); await sequelize.transaction(async (transaction) => { const address = await ClientAddress.findOne({ where: { id: addressId, partner_id: partnerId }, transaction }); if (!address) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND"); const count = await ClientAddress.count({ where: { partner_id: partnerId }, transaction }); assertAddressCanBeDeleted(address.principal, count); await address.destroy({ transaction }); }); }
    return noStoreResponse(NextResponse.json({ success: true, message: "Endereço removido.", data: {} }));
  } catch (error) { return noStoreResponse(controllerErrorResponse(error)); } }

  static async setPrimary(request: NextRequest, addressId: string) { try {
    const partnerId = await partnerIdFrom(request); let address;
    if (usesLocalAuthStore()) address = await setLocalPrimaryPartnerAddress(partnerId, addressId); else { assertDatabaseConfigured(); address = await sequelize.transaction(async (transaction) => { const existing = await ClientAddress.findOne({ where: { id: addressId, partner_id: partnerId }, transaction }); if (!existing) throw new AppError("Endereço não encontrado.", 404, "ADDRESS_NOT_FOUND"); await ClientAddress.update({ principal: false }, { where: { partner_id: partnerId }, transaction }); return existing.update({ principal: true }, { transaction }); }); }
    return response(address, "Endereço principal atualizado.");
  } catch (error) { return noStoreResponse(controllerErrorResponse(error)); } }
}
