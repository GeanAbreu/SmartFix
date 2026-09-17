"use client";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint, NearbyPartner } from "@/src/types/discovery";
import styles from "./assistencias.module.css";

export default function AssistanceMap({ origin, partners, radius, onSelect }: {
  origin: GeoPoint; partners: NearbyPartner[]; radius: number; onSelect: (id: string) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { scrollWheelZoom: false }).setView([origin.lat, origin.lng], 12);
    const tiles = L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
    }).addTo(map);
    tiles.on("tileerror", () => setFailed(true));
    const area = L.circle([origin.lat, origin.lng], { radius: radius * 1000, color: "#398fff", weight: 1, fillOpacity: .05 }).addTo(map);
    L.circleMarker([origin.lat, origin.lng], { radius: 7, color: "white", fillColor: "#2574ec", fillOpacity: 1, weight: 3 })
      .bindTooltip("Localização da busca").addTo(map);
    partners.forEach((partner, index) => {
      const icon = L.divIcon({ className: styles.pin, html: `<span>${index + 1}</span>`, iconSize: [34, 34], iconAnchor: [17, 34] });
      const marker = L.marker([partner.lat, partner.lng], { icon, title: partner.name, alt: partner.name }).addTo(map);
      const label = document.createElement("span"); label.textContent = partner.name;
      marker.bindTooltip(label).on("click", () => onSelect(partner.id));
    });
    map.fitBounds(area.getBounds(), { padding: [18, 18] });
    const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(element.current);
    return () => { observer.disconnect(); map.remove(); };
  }, [origin, partners, radius, onSelect]);
  return <section className={styles.mapWrap} aria-label="Mapa das assistências">
    <div ref={element} className={styles.map} />
    {failed && <p role="status" className={styles.mapNotice}>O mapa está indisponível em parte. Você pode usar a lista de assistências.</p>}
    <div className={styles.mapLegend}><span>● Localização da busca</span><span>● Assistências por proximidade</span></div>
  </section>;
}
