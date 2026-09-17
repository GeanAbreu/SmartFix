import { NextRequest, NextResponse } from "next/server";
import { Op, QueryTypes } from "sequelize";
import { z } from "zod";
import sequelize, { assertDatabaseConfigured } from "@/src/config/database";
import { ClientAddress, Partner, Review } from "@/src/models";
import { actorFrom } from "@/src/services/account.service";
import { locate } from "@/src/services/geocoding.service";
import { distanceKm } from "@/src/services/distance";
import { AppError } from "@/src/errors/AppError";
import type { GeoPoint, NearbyPartner } from "@/src/types/discovery";
import { controllerErrorResponse, noStoreResponse } from "./controller.utils";

const point = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180),
  label: z.string().max(250), precision: z.enum(["gps", "cep", "city"]) });
export const discoveryInput = z.object({
  origin: point.optional(), addressId: z.string().uuid().optional(),
  radius: z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50), z.literal(100)]).default(10),
}).refine((v) => Boolean(v.origin) !== Boolean(v.addressId), "Selecione uma localização.");
const ok = (data: unknown) => noStoreResponse(NextResponse.json({ success: true, data }));
async function client(request: NextRequest) {
  const actor = await actorFrom(request);
  if (actor.role !== "client") throw new AppError("Esta área é exclusiva para clientes.", 403, "FORBIDDEN");
  assertDatabaseConfigured();
  return actor;
}
export class DiscoveryController {
  static async locations(request: NextRequest) {
    try {
      await client(request);
      const { query } = z.object({ query: z.string().trim().min(3).max(120) }).parse(await request.json());
      return ok({ locations: await locate(query) });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
  static async search(request: NextRequest) {
    try {
      const actor = await client(request);
      const input = discoveryInput.parse(await request.json());
      let origin: GeoPoint;
      if (input.addressId) {
        const address = await ClientAddress.findOne({ where: { id: input.addressId, client_id: actor.sub } });
        if (!address) throw new AppError("Endereço não encontrado.", 404, "NOT_FOUND");
        const [location] = await locate(address.cep);
        if (!location) throw new AppError("Não encontramos coordenadas para este CEP. Use sua localização ou busque por cidade.", 422, "LOCATION_NOT_FOUND");
        origin = { ...location, label: `${address.apelido || "Meu endereço"} · ${address.cidade}/${address.estado}` };
      } else origin = input.origin!;
      const partners = await Partner.findAll({ where: { is_verified: true }, attributes: ["id", "company_name", "full_name"] });
      const addresses = partners.length ? await ClientAddress.findAll({
        where: { partner_id: { [Op.in]: partners.map((p) => p.id) } }, order: [["principal", "DESC"], ["id", "ASC"]],
      }) : [];
      const ratings = await sequelize.query<{ partner_id: string; rating: string; count: string }>(
        "SELECT partner_id, AVG(rating) AS rating, COUNT(*) AS count FROM reviews GROUP BY partner_id", { type: QueryTypes.SELECT });
      const results: NearbyPartner[] = [];
      let unavailableLocations = 0;
      for (const partner of partners) {
        const address = addresses.find((a) => a.partner_id === partner.id);
        if (!address) { unavailableLocations++; continue; }
        let location: GeoPoint | undefined;
        try { [location] = await locate(address.cep); } catch { /* Report omitted locations, never invent coordinates. */ }
        if (!location) { unavailableLocations++; continue; }
        const distance = distanceKm(origin, location);
        if (distance > input.radius) continue;
        const rating = ratings.find((r) => r.partner_id === partner.id);
        results.push({ id: partner.id, name: partner.company_name || partner.full_name,
          address: `${address.logradouro}, ${address.numero} · ${address.bairro} · ${address.cidade}/${address.estado}`,
          lat: location.lat, lng: location.lng, distanceKm: distance,
          rating: rating ? Number(rating.rating) : null, reviewCount: rating ? Number(rating.count) : 0 });
      }
      results.sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name));
      return ok({ origin, partners: results, unavailableLocations });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
  static async reviews(request: NextRequest, id: string) {
    try {
      await client(request);
      z.string().uuid().parse(id);
      if (!await Partner.findOne({ where: { id, is_verified: true }, attributes: ["id"] }))
        throw new AppError("Assistência não encontrada.", 404, "NOT_FOUND");
      return ok({ reviews: await Review.findAll({ where: { partner_id: id },
        attributes: ["id", "rating", "comment", "review_date"], order: [["review_date", "DESC"], ["id", "DESC"]], limit: 10 }) });
    } catch (error) { return noStoreResponse(controllerErrorResponse(error)); }
  }
}
