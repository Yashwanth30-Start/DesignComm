import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CommissionOS",
    short_name: "CommissionOS",
    description: "The operating system for construction commissioning.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070A",
    theme_color: "#0E1113",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
