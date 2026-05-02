import { ImageResponse } from "next/og";

// iOS expects a 180x180 PNG for "Add to Home Screen". Next renders this at
// build time and serves it at /apple-icon.png with the right link tag.
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
          // iOS will round-corner this for us; fill the whole frame.
          background:
            "linear-gradient(135deg, #4f8ef7 0%, #22d3ee 100%)",
          color: "white",
          fontSize: 104,
          fontWeight: 900,
          letterSpacing: -4,
        }}
      >
        L
      </div>
    ),
    { ...size }
  );
}
