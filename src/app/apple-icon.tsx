import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#fff8e8",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "linear-gradient(145deg, #ffb719, #df720c)",
            borderRadius: 42,
            color: "#fffaf0",
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            height: 140,
            justifyContent: "center",
            letterSpacing: -7,
            paddingRight: 7,
            width: 140,
          }}
        >
          AN
        </div>
      </div>
    ),
    size,
  );
}
