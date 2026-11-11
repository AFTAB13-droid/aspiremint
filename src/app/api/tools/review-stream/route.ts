import { NextRequest, NextResponse } from "next/server";
import { FlipkartReviewService, FlipkartReview } from "@/services/flipkartReview.service";

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
          msg: "Connecting to Flipkart marketplace catalog...",
        });

        // 2. Fetch product metadata AND Page 1 reviews concurrently (< 900ms)
        let scannedSlots = 0;
        scannedSlots++;
        const [meta, page1] = await Promise.all([
          FlipkartReviewService.fetchProductMeta(pid, slug, itm),
          FlipkartReviewService.fetchPage(pid, slug, itm, 1, "MOST_HELPFUL"),
        ]);

        let totalReviewsReported = page1.totalReviews || meta?.totalReviews || 0;
        const resolvedTitle =
          page1.productTitle ||
          meta?.title ||
          (slug
            ? slug
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ")
            : "Product");

        sendEvent({
          type: "meta",
          total_reviews: totalReviewsReported,
          total_ratings: meta?.totalRatings || 0,
          rating: meta?.rating || 4.2,
          product: {
            title: resolvedTitle,
            imageUrl: meta?.imageUrl || "",
            price: meta?.price,
            mrp: meta?.mrp,
            discount: meta?.discount,
            rating: meta?.rating,
          },
        });

        // Track seen review IDs to deduplicate across sorting orders
        const seenIds = new Set<string>();

        if (page1.totalReviews && page1.totalReviews > totalReviewsReported) {
          totalReviewsReported = page1.totalReviews;
        }

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

        // 4. Ultra-Speed Multi-Slot Expansion: Scan across all review sorts & channels
        // Aiming for 400-500 reviews with high concurrency
        const slotsToScan: Array<{ page: number; sort: string; cb: boolean }> = [];

        // Channel A: Most Recent (Pages 1 to 14)
        for (let p = 1; p <= 14; p++) slotsToScan.push({ page: p, sort: "MOST_RECENT", cb: false });

        // Channel B: Most Helpful (Pages 2 to 14 - page 1 already fetched)
        for (let p = 2; p <= 14; p++) slotsToScan.push({ page: p, sort: "MOST_HELPFUL", cb: false });

        // Channel C: Positive Reviews (Pages 1 to 10)
        for (let p = 1; p <= 10; p++) slotsToScan.push({ page: p, sort: "POSITIVE_FIRST", cb: false });

        // Channel D: Critical / Negative Reviews (Pages 1 to 10)
        for (let p = 1; p <= 10; p++) slotsToScan.push({ page: p, sort: "NEGATIVE_FIRST", cb: false });

        // Channel E: Certified Buyer Most Recent (Pages 1 to 8)
        for (let p = 1; p <= 8; p++) slotsToScan.push({ page: p, sort: "MOST_RECENT", cb: true });

        // Channel F: Certified Buyer Most Helpful (Pages 1 to 8)
        for (let p = 1; p <= 8; p++) slotsToScan.push({ page: p, sort: "MOST_HELPFUL", cb: true });

        // Process in high-concurrency batches of 10 parallel requests for 10x faster speed
        const BATCH_SIZE = 10;
        for (let i = 0; i < slotsToScan.length; i += BATCH_SIZE) {
          // If we reached target 400-500 reviews, finish early
          if (seenIds.size >= 450) break;

          const batch = slotsToScan.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(({ page, sort, cb }) =>
              FlipkartReviewService.fetchPage(pid, slug, itm, page, sort, cb)
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
