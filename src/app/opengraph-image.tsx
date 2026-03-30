import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Shapiro Group | Austin Luxury Real Estate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Read the SG icon for embedding
  const iconPath = join(process.cwd(), "public/images/logos/sg-icon-white.png");
  let iconBase64 = "";
  try {
    const iconBuffer = await readFile(iconPath);
    iconBase64 = `data:image/png;base64,${iconBuffer.toString("base64")}`;
  } catch {
    // Fallback if file not found
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A1628",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Gold accent glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
          }}
        />

        {/* SG Icon */}
        {iconBase64 && (
          <img
            src={iconBase64}
            width={120}
            height={120}
            style={{ marginBottom: "24px" }}
          />
        )}

        {/* Text */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <span style={{ fontSize: "48px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" }}>
            SHAPIRO
          </span>
          <span style={{ fontSize: "48px", fontWeight: 300, color: "#C9A96E", letterSpacing: "0.08em" }}>
            GROUP
          </span>
        </div>

        <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.4)", fontWeight: 300, letterSpacing: "0.15em" }}>
          AUSTIN REAL ESTATE
        </p>

        {/* SuperSearch badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "32px",
            padding: "10px 24px",
            border: "1px solid rgba(201,169,110,0.3)",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#C9A96E", letterSpacing: "0.15em" }}>
            SUPERSEARCH — MORE LISTINGS THAN ZILLOW
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
