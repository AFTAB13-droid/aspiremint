import { NextRequest, NextResponse } from "next/server";
import { FlipkartReviewService, FlipkartReview } from "@/services/flipkartReview.service";

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
          msg: "Connecting to Flipkart & Shopsy catalog...",
        });

        // 2. Fetch product metadata (title, real photo, pricing, true total review count)
        const meta = await FlipkartReviewService.fetchProductMeta(pid, slug);
        const totalReviewsReported = meta?.totalReviews || 0;

        sendEvent({
          type: "meta",
          total_reviews: totalReviewsReported,
          total_ratings: meta?.totalRatings || 0,
          rating: meta?.rating || 4.2,
          product: {
            title:
              meta?.title ||
              (slug
                ? slug
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")
                : "Product"),
            imageUrl: meta?.imageUrl || "",
            price: meta?.price,
            mrp: meta?.mrp,
            discount: meta?.discount,
            rating: meta?.rating,
          },
        });

        // Track seen review IDs to deduplicate across sorting orders
        const seenIds = new Set<string>();
        let scannedSlots = 0;

        // 3. Immediately fetch Page 1 (Most Helpful)
        scannedSlots++;
        const page1 = await FlipkartReviewService.fetchPage(
          pid,
          slug,
          itm,
          1,
          "MOST_HELPFUL"
        );

        if (page1.reviews && page1.reviews.length > 0) {
          const freshReviews: FlipkartReview[] = [];
          for (const r of page1.reviews) {
            if (!seenIds.has(r.id)) {
              seenIds.add(r.id);
              freshReviews.push(r);
            }
          }

          if (freshReviews.length > 0) {
            sendEvent({
              type: "batch",
              reviews: freshReviews,
            });
            sendEvent({
              type: "progress",
              loaded: seenIds.size,
              total: totalReviewsReported || seenIds.size,
              slotsScanned: scannedSlots,
            });
          }
        } else if (totalReviewsReported === 0) {
          sendEvent({
            type: "error",
            msg: "No public reviews found for this product listing.",
          });
          controller.close();
          return;
        }

        // 4. Multi-sort slot expansion: Scan across multiple sort orders concurrently
        // (MOST_RECENT, MOST_HELPFUL, POSITIVE_FIRST, NEGATIVE_FIRST)
        const slotsToScan: Array<{ page: number; sort: string }> = [
          // MOST_RECENT gives fresh reviews
          { page: 1, sort: "MOST_RECENT" },
          { page: 2, sort: "MOST_RECENT" },
          { page: 3, sort: "MOST_RECENT" },
          { page: 4, sort: "MOST_RECENT" },
          { page: 5, sort: "MOST_RECENT" },
          { page: 6, sort: "MOST_RECENT" },

          // MOST_HELPFUL pages 2 to 6
          { page: 2, sort: "MOST_HELPFUL" },
          { page: 3, sort: "MOST_HELPFUL" },
          { page: 4, sort: "MOST_HELPFUL" },
          { page: 5, sort: "MOST_HELPFUL" },
          { page: 6, sort: "MOST_HELPFUL" },

          // POSITIVE_FIRST
          { page: 1, sort: "POSITIVE_FIRST" },
          { page: 2, sort: "POSITIVE_FIRST" },
          { page: 3, sort: "POSITIVE_FIRST" },
          { page: 4, sort: "POSITIVE_FIRST" },

          // NEGATIVE_FIRST
          { page: 1, sort: "NEGATIVE_FIRST" },
          { page: 2, sort: "NEGATIVE_FIRST" },
          { page: 3, sort: "NEGATIVE_FIRST" },
          { page: 4, sort: "NEGATIVE_FIRST" },
        ];

        // Process in concurrent batches of 5 requests for maximum speed
        const BATCH_SIZE = 5;
        for (let i = 0; i < slotsToScan.length; i += BATCH_SIZE) {
          const batch = slotsToScan.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(({ page, sort }) =>
              FlipkartReviewService.fetchPage(pid, slug, itm, page, sort)
            )
          );

          scannedSlots += batch.length;
          const freshBatchReviews: FlipkartReview[] = [];

          for (const res of results) {
            if (res.status === "fulfilled" && res.value.reviews.length > 0) {
              for (const r of res.value.reviews) {
                if (!seenIds.has(r.id)) {
                  seenIds.add(r.id);
                  freshBatchReviews.push(r);
                }
              }
            }
          }

          if (freshBatchReviews.length > 0) {
            sendEvent({
              type: "batch",
              reviews: freshBatchReviews,
            });
          }

          sendEvent({
            type: "progress",
            loaded: seenIds.size,
            total: totalReviewsReported || seenIds.size,
            slotsScanned: scannedSlots,
          });
        }

        // 5. Complete
        sendEvent({
          type: "done",
          totalLoaded: seenIds.size,
          totalReported: totalReviewsReported,
          slotsScanned: scannedSlots,
        });
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
