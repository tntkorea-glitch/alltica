import { ImageResponse } from "next/og";

export const alt = "Alltica — 모든 신청, 한 곳에서";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          background: "linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 50%, #2a5080 100%)",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(96,165,250,0.15)",
            filter: "blur(80px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(129,140,248,0.15)",
            filter: "blur(80px)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: 22,
            marginBottom: 32,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80" }} />
          신청 접수 중
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: -2,
            marginBottom: 18,
            display: "flex",
          }}
        >
          Alltica
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "rgba(219,234,254,0.95)",
            marginBottom: 8,
          }}
        >
          모든 신청, 한 곳에서
        </div>

        <div
          style={{
            fontSize: 26,
            color: "rgba(191,219,254,0.7)",
            marginTop: 16,
          }}
        >
          세미나 · 제품 · 인재 · 파트너
        </div>
      </div>
    ),
    size
  );
}
