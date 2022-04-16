import { LayerGroup } from "leaflet";
import { useEffect, useRef } from "react";
import * as z from "zod";
import { wait } from "~/utils";

const nominatimResponse = z.array(
  z.object({ lat: z.string(), lon: z.string() })
);

/**
 * null represents cache found with no result, undefined represents no cache found
 */
function getCache(url: string): null | undefined | [number, number] {
  const item = localStorage.getItem(url);

  if (item === null) {
    return undefined;
  }

  const parts = item.split(";");
  if (parts.length !== 2) {
    return undefined;
  }

  return [parseFloat(parts[0]), parseFloat(parts[1])];
}

function setCache(url: string, latlon: [number, number]): void {
  localStorage.setItem(url, `${latlon[0]};${latlon[1]}`);
}

interface MapProps {
  addresses: { postalCode: string; city: string; country: string }[];
}

export function Map(props: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerGroupRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    if (mapRef.current) {
      const L = require("leaflet");
      const map = L.map(mapRef.current).setView([49.1385965, 9.7338867], 6);

      markerGroupRef.current = L.layerGroup().addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          'Kartendaten &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> Mitwirkende',
        useCache: true,
      }).addTo(map);
    }
  }, []);

  useEffect(() => {
    const L = require("leaflet");

    const cb = async () => {
      const urls = props.addresses.map((a) => {
        const query = new URLSearchParams({
          city: a.city,
          postalcode: a.postalCode,
          country: a.country,
          format: "json",
        });

        return `https://nominatim.openstreetmap.org/search?${query}`;
      });

      for (const url of urls) {
        const cache = getCache(url);
        if (cache === undefined) {
          console.log("no cache entry found");
          try {
            await wait(1000);
            const result = await fetch(url, {
              headers: { "Access-Control-Allow-Origin": "*" },
            }).then((r) => r.json());

            const r = nominatimResponse.safeParse(result);
            if (r.success) {
              console.log(
                "setting marker: " + r.data[0].lat + ", " + r.data[0].lon
              );
              const lat = parseFloat(r.data[0].lat);
              const lon = parseFloat(r.data[0].lon);
              setCache(url, [lat, lon]);
              L.marker([lat, lon]).addTo(markerGroupRef.current);
            } else {
              console.warn(`failed parsing: ${r.error}`);
            }
          } catch (e) {
            console.warn("failed: " + e);
          }
        } else if (cache === null) {
          console.log("cache entry with no result");
        } else {
          console.log(`cache entry found: ${cache[0]}, ${cache[1]}`);
          L.marker(cache).addTo(markerGroupRef.current);
        }
      }
    };
    cb();
  }, [JSON.stringify(props.addresses)]);

  return <div style={{ height: "800px", width: "100%" }} ref={mapRef}></div>;
}
