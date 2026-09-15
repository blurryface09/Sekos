import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Somewhere With You",
    short_name: "Somewhere",
    description: "A shared itinerary and diary for two.",
    start_url: "/us",
    display: "standalone",
    background_color: "#FFF6F9",
    theme_color: "#D2447A",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
