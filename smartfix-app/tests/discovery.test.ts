import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { distanceKm } from "../src/services/distance";
import { locate } from "../src/services/geocoding.service";
import { DiscoveryController, discoveryInput } from "../src/controllers/DiscoveryController";
import { WorkflowController } from "../src/controllers/WorkflowController";
import { Client, ClientAddress, Partner, PartnerService, Review } from "../src/models";
import { Workflow } from "../src/models/Workflow";
import sequelize from "../src/config/database";
import { createSessionToken } from "../src/services/session.service";

test("distância em linha reta: origem, simetria, um grau e antimeridiano", () => {
  assert.equal(distanceKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 }), 0);
  assert.ok(Math.abs(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 111.195) < .01);
  const a = { lat: -23.55, lng: -46.63 }, b = { lat: -22.90, lng: -43.17 };
  assert.equal(distanceKm(a, b), distanceKm(b, a));
  assert.ok(distanceKm({ lat: 0, lng: 179 }, { lat: 0, lng: -179 }) < 223);
});
test("busca exige uma única origem válida e limita o raio", () => {
  const origin = { lat: 0, lng: 0, label: "GPS", precision: "gps" };
  assert.equal(discoveryInput.parse({ origin }).radius, 10);
  for (const value of [{}, { origin, radius: 10000 }, { origin, addressId: randomUUID() },
    { origin: { ...origin, lat: 91 } }, { origin: { ...origin, lng: Infinity } }])
    assert.equal(discoveryInput.safeParse(value).success, false);
});
test("geocodificação não inventa coordenadas ausentes e reaproveita o cache", async (t) => {
  let calls = 0;
  t.mock.method(globalThis, "fetch", async (url: URL) => {
    calls++;
    return Response.json(url.pathname.endsWith("99999000")
      ? { location: { coordinates: { latitude: "", longitude: null } } }
      : { city: "Cidade", state: "SP", location: { coordinates: { latitude: "-23", longitude: "-46" } } });
  });
  assert.deepEqual(await locate("99999000"), []);
  const [a, b] = await Promise.all([locate("99999001"), locate("99999001")]);
  assert.deepEqual(a, b); assert.equal(a[0].precision, "cep");
  await locate("99999001"); assert.equal(calls, 2);
});
test("busca protegida considera apenas parceiros ativos e avaliações publicadas", async (t) => {
  const previous = { ...process.env };
  process.env.DATABASE_URL = "postgres://test:test@localhost/test";
  process.env.SESSION_SECRET = "discovery-test-session-secret-with-32-characters";
  const clientId = "1", partnerId = "2";
  t.mock.method(Workflow, "findAll", async () => []);
  t.mock.method(Client, "unscoped", () => ({ findByPk: async () => ({ id: clientId, nome: "Teste", email: "test@example.test" }) }));
  t.mock.method(Partner, "unscoped", () => ({ findByPk: async () => ({ id: partnerId }) }));
  t.mock.method(Partner, "findAll", async (options: { where: { is_verified?: boolean; is_active: boolean }; attributes: string[] }) => {
    assert.equal(options.where.is_active, true);
    if (options.where.is_verified) assert.ok(!options.attributes.includes("email"));
    return [{ id: partnerId, company_name: "Oficina Teste", full_name: "Responsável", email: "oficina@example.test", cnpj: "123", is_verified: true }];
  });
  t.mock.method(Partner, "findOne", async (options: { where: { id: string; is_verified: boolean; is_active: boolean } }) => {
    assert.deepEqual(options.where, { id: partnerId, is_verified: true, is_active: true });
    return { id: partnerId };
  });
  t.mock.method(Review, "findAll", async (options: { where: { partner_id: string | string[]; moderation_status: string } }) => {
    assert.equal(options.where.moderation_status, "published");
    if (Array.isArray(options.where.partner_id)) assert.deepEqual(options.where.partner_id, [partnerId]);
    else assert.equal(options.where.partner_id, partnerId);
    return [{ id: "10", partner_id: partnerId, rating: 5, comment: "Ótimo", review_date: "2026-11-01" }];
  });
  t.mock.method(PartnerService, "findAll", async () => []);
  t.mock.method(ClientAddress, "findAll", async () => [{ partner_id: partnerId, cep: "99999002", logradouro: "Rua", numero: "1", bairro: "Centro", cidade: "Cidade", estado: "SP" }]);
  t.mock.method(ClientAddress, "findOne", async (options: { where: { client_id: string } }) => {
    assert.equal(options.where.client_id, clientId); return null;
  });
  t.mock.method(sequelize, "query", async (...args: unknown[]) => {
    assert.match(String(args[0]), /moderation_status\s*=\s*'published'/);
    return [{ partner_id: partnerId, rating: "4.5", count: "2" }];
  });
  t.mock.method(globalThis, "fetch", async () => Response.json({ city: "Cidade", state: "SP", location: { coordinates: { latitude: "0.01", longitude: "0" } } }));
  const request = (body: unknown, role: "client" | "partner" | null = "client") => new NextRequest("http://localhost/api/partners/nearby", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json",
      ...(role ? { cookie: `smartfix_session=${createSessionToken({ sub: role === "client" ? clientId : partnerId, role })}` } : {}) },
  });
  const origin = { lat: 0, lng: 0, label: "Teste", precision: "gps" };
  try {
    assert.equal((await DiscoveryController.search(request({ origin }, null))).status, 401);
    assert.equal((await DiscoveryController.search(request({ origin }, "partner"))).status, 403);
    assert.equal((await DiscoveryController.search(request({ addressId: "999" }))).status, 404);
    const response = await DiscoveryController.search(request({ origin }));
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.partners.length, 1); assert.equal(data.partners[0].rating, 4.5);
    assert.equal(data.partners[0].reviewCount, 2); assert.ok(data.partners[0].distanceKm < 2);
    const far = await DiscoveryController.search(request({ origin: { ...origin, lat: 10 } }));
    assert.equal((await far.json()).data.partners.length, 0);
    const reviews = await DiscoveryController.reviews(request({ origin }), partnerId);
    assert.equal(reviews.status, 200);
    assert.equal((await reviews.json()).data.reviews.length, 1);
    const publicPartners = await WorkflowController.partners(new NextRequest("http://localhost/api/partners", {
      headers: { cookie: `smartfix_session=${createSessionToken({ sub: clientId, role: "client" })}` },
    }));
    assert.equal(publicPartners.status, 200);
    const publicPartnerPayload = (await publicPartners.json()).data.partners;
    assert.equal(publicPartnerPayload.length, 1);
    assert.equal(publicPartnerPayload[0].rating, 5);
  } finally { process.env = previous; }
});
