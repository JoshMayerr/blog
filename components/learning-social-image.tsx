import { ImageResponse } from "next/og";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export function learningSocialImage(title: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#0f172a",
          padding: "72px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30 }}>Josh Mayer</div>
        <div
          style={{
            display: "flex",
            maxWidth: "1000px",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 30 }}>Learning</div>
      </div>
    ),
    socialImageSize,
  );
}
