import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dirPath = path.join(process.cwd(), "public", "mouse hover");
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ images: [] });
    }

    const files = fs.readdirSync(dirPath);
    const validExtensions = new Set([
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".svg",
      ".gif",
    ]);

    const images = files
      .filter((file) => validExtensions.has(path.extname(file).toLowerCase()))
      .map((file) => `/mouse%20hover/${encodeURIComponent(file)}`);

    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("Error reading mouse hover directory:", err);
    return NextResponse.json({ images: [] });
  }
}
