import { NextRequest, NextResponse } from "next/server";
import { FlipkartReviewService } from "@/services/flipkartReview.service";

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

  const urlInfo = await FlipkartReviewService.resolveUrl(targetUrl);
  if (!urlInfo || !urlInfo.pid) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Could not identify a valid Flipkart Product ID (PID). Please check your link.",
      },
      { status: 400 }
    );
  }

  const { pid, slug, itm } = urlInfo;

  // Stream reviews in SSE format for real-time frontend consumption
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {}
      };

      try {
        // 1. Initial info
        sendEvent({
          type: "init",
          pid,
          slug,
          itm,
        });

        sendEvent({
          type: "log",
          msg: "Scanning Flipkart product reviews in real-time...",
        });

        // 2. Fetch Page 1
        const page1 = await FlipkartReviewService.fetchPage(pid, slug, itm, 1);

        if (!page1.reviews || page1.reviews.length === 0) {
          sendEvent({
            type: "error",
            msg: "No public reviews found for this product listing.",
          });
          controller.close();
          return;
        }

        // Meta event
        sendEvent({
          type: "meta",
          total_pages: 5,
          total_reviews: Math.max(page1.reviews.length, 50),
        });

        // Send page 1 batch immediately
        sendEvent({
          type: "batch",
          reviews: page1.reviews,
        });

        // 3. Concurrently fetch pages 2 to 4 for lightning-fast population
        const remainingPages = [2, 3, 4];
        const pageResults = await Promise.allSettled(
          remainingPages.map((pageNum) =>
            FlipkartReviewService.fetchPage(pid, slug, itm, pageNum)
          )
        );

        for (const res of pageResults) {
          if (res.status === "fulfilled" && res.value.reviews.length > 0) {
            sendEvent({
              type: "batch",
              reviews: res.value.reviews,
            });
          }
        }

        // 4. Finished
        sendEvent({ type: "done" });
      } catch (err: any) {
        console.error("In-House Review Stream Error:", err);
        sendEvent({
          type: "error",
          msg: err?.message || "Failed to stream reviews.",
        });
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
