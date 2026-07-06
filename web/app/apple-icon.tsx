import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0E1113, #151A1C)",
        }}
      >
        <div
          style={{
            width: "72%",
            height: "72%",
            borderRadius: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #6FE3F2, #B8A7FF, #2ECC71)",
          }}
        >
          <span style={{ fontSize: 84, fontWeight: 700, color: "#05070A" }}>C</span>
        </div>
      </div>
    ),
    size
  );
}
