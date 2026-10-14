import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: cat rescue in ${site.city}, ${site.region}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#111111",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 72, lineHeight: 1.1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span>Every cat deserves</span>
          <span style={{ display: "flex" }}>
            <span>a</span>
            <i style={{ margin: "0 18px" }}>soft place</i>
            <span>to land.</span>
          </span>
        </div>
        <div style={{ marginTop: 40, fontSize: 30, color: "#6b6b6b", fontFamily: "sans-serif" }}>
          {`${site.name} · ${site.city}, ${site.regionCode}`}
        </div>
      </div>
    ),
    size,
  );
}
