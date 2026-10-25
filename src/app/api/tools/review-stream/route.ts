import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim();

  if (!targetUrl) {
    return NextResponse.json(
      { success: false, message: "A valid Flipkart product URL is required." },
      { status: 400 }
    );
  }

  try {
    let resolvedUrl = targetUrl;
    if (targetUrl.includes("dl.flipkart.com") || targetUrl.includes("fkrt.it")) {
      try {
        const headRes = await fetch(targetUrl, {
          method: "HEAD",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        });
        if (headRes.url) {
          resolvedUrl = headRes.url;
        }
      } catch (redirectErr) {
        console.warn("Could not follow redirect, using original URL:", redirectErr);
      }
    }

    const upstreamUrl = `https://rikome.com/api/review-finder?url=${encodeURIComponent(resolvedUrl)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        Accept: "text/event-stream",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to initiate review stream (HTTP ${upstreamRes.status})`,
        },
        { status: upstreamRes.status || 500 }
      );
    }

    return new Response(upstreamRes.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    console.error("Review stream error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to scan reviews." },
      { status: 500 }
    );
  }
}
