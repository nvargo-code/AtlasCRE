import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1628",
          borderRadius: "4px",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            fontWeight: 800,
            color: "#C9A96E",
            fontFamily: "system-ui",
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
