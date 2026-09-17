export type GeoPoint = { lat: number; lng: number; label: string; precision: "cep" | "city" | "gps" };
export type NearbyPartner = {
  id: string; name: string; address: string; lat: number; lng: number;
  distanceKm: number; rating: number | null; reviewCount: number;
};
export type DiscoveryResult = {
  origin: GeoPoint; partners: NearbyPartner[]; unavailableLocations: number;
};
