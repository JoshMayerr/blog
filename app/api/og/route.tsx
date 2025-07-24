import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const description = searchParams.get("description");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#000",
          color: "#fff",
          padding: "80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            background: `
              radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, #fff 0%, transparent 50%)
            `,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            maxWidth: "1000px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Subtle accent line */}
          <div
            style={{
              width: "60px",
              height: "3px",
              backgroundColor: "#fff",
              marginBottom: "40px",
              opacity: 0.8,
            }}
          />

          <h1
            style={{
              fontSize: "56px",
              fontWeight: "700",
              margin: "0 0 30px 0",
              lineHeight: "1.1",
              color: "#fff",
              letterSpacing: "-0.02em",
              maxWidth: "900px",
            }}
          >
            {title || "Blog Post"}
          </h1>

          {description && (
            <p
              style={{
                fontSize: "28px",
                margin: "0 0 40px 0",
                opacity: 0.8,
                lineHeight: "1.4",
                maxWidth: "900px",
                fontWeight: "400",
                color: "#e5e5e5",
              }}
            >
              {description}
            </p>
          )}

          {/* Bottom info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "20px",
              opacity: 0.6,
              marginTop: "auto",
              color: "#a0a0a0",
            }}
          >
            <span style={{ fontWeight: "500" }}>Josh Mayer</span>
            <span style={{ margin: "0 12px", opacity: 0.4 }}>•</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
