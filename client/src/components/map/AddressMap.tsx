"use client";

import { useEffect, useRef, useCallback } from "react";
import { Navigation } from "lucide-react";

export interface PickedLocation {
  lat: number;
  lng: number;
  displayName: string;
}

interface AddressMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationPick: (loc: PickedLocation) => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`,
      { headers: { "User-Agent": "BefitNutritionApp/1.0" } }
    );
    const data = await res.json();
    const a = data.address || {};
    return [a.road || a.pedestrian || a.street, a.house_number, a.suburb || a.city_district, a.city || a.town]
      .filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 3).join(",").trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export async function searchAddresses(query: string): Promise<Array<{ lat: string; lon: string; display_name: string }>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
      { headers: { "User-Agent": "BefitNutritionApp/1.0" } }
    );
    return res.json();
  } catch { return []; }
}

export default function AddressMap({ initialLat, initialLng, onLocationPick }: AddressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  const placeMarker = useCallback(async (lat: number, lng: number) => {
    if (!mapRef.current || !LRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = LRef.current.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on("dragend", async (e: any) => {
        const { lat: dlat, lng: dlng } = e.target.getLatLng();
        const name = await reverseGeocode(dlat, dlng);
        onLocationPick({ lat: dlat, lng: dlng, displayName: name });
      });
    }
    const name = await reverseGeocode(lat, lng);
    onLocationPick({ lat, lng, displayName: name });
  }, [onLocationPick]);

  // Expose placeMarker for parent use
  useEffect(() => {
    (containerRef.current as any).__placeMarker = placeMarker;
    (containerRef.current as any).__flyTo = (lat: number, lng: number) => {
      mapRef.current?.flyTo([lat, lng], 16);
    };
  }, [placeMarker]);

  useEffect(() => {
    if (typeof window === "undefined" || mapRef.current) return;
    const defaultLat = initialLat ?? 41.2995;
    const defaultLng = initialLng ?? 69.2401;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;
      LRef.current = L.default;
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.default.map(containerRef.current!, { zoomControl: false })
        .setView([defaultLat, defaultLng], 15);
      mapRef.current = map;
      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      L.default.control.zoom({ position: "topright" }).addTo(map);

      if (initialLat && initialLng) placeMarker(initialLat, initialLng);

      map.on("click", (e: any) => placeMarker(e.latlng.lat, e.latlng.lng));
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLocateMe = () => {
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      mapRef.current?.flyTo([lat, lng], 17);
      await placeMarker(lat, lng);
    });
  };

  return (
    <div className="relative w-full h-full">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
      <div ref={containerRef} className="w-full h-full" />
      <button type="button" onClick={handleLocateMe}
        className="absolute top-3 right-3 z-[1000] w-10 h-10 rounded-xl bg-[rgb(var(--bg))] shadow-lg flex items-center justify-center text-[rgb(var(--text))] hover:bg-[rgb(var(--surface))] transition">
        <Navigation className="w-4 h-4" />
      </button>
    </div>
  );
}
