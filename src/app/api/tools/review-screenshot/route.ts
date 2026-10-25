import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();
  const shouldDownload = searchParams.get("download") === "true";

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, message: "A review permalink URL is required." },
      { status: 400 }
    );
  }

  try {
    const upstreamUrl = `https://rikome.com/api/review-screenshot?url=${encodeURIComponent(targetUrl)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          message: errText || `Failed to generate review screenshot (HTTP ${upstreamRes.status})`,
        },
        { status: upstreamRes.status || 500 }
      );
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/png";
    const imageArrayBuffer = await upstreamRes.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": imageBuffer.length.toString(),
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    };

    if (shouldDownload) {
      const filename = `flipkart-review-proof-${Date.now()}.png`;
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new Response(imageBuffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Review screenshot error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to generate screenshot proof." },
      { status: 500 }
    );
  }
}
