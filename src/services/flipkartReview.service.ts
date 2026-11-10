/**
 * In-House Native Flipkart & Shopsy Review Extraction Service
 * 100% In-House - No third-party dependencies (Rikome-free)
 */

export interface FlipkartReview {
  id: string;
  rating: string | number;
  title?: string;
  text?: string;
  name?: string;
  location?: string;
  date?: string;
  verified?: boolean;
  images?: string[];
  helpful?: number;
  attributes?: string;
  permalink?: string;
  ref?: string;
}

export interface FlipkartProductMeta {
  title: string;
  imageUrl: string;
  price?: number;
  mrp?: number;
  discount?: string;
  rating?: number;
  totalReviews?: number;
  totalRatings?: number;
}

export interface FlipkartUrlInfo {
  rawUrl: string;
  resolvedUrl: string;
  pid: string;
  slug: string;
  itm: string;
}

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-IN,en;q=0.9",
  "Sec-Ch-Ua":
    '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

export class FlipkartReviewService {
  /**
   * Resolves short links (dl.flipkart.com, fkrt.it) and extracts pid, slug, and itm
   */
  static async resolveUrl(rawUrl: string): Promise<FlipkartUrlInfo | null> {
    let cleanUrl = rawUrl.trim();
    if (!cleanUrl) return null;

    // Auto-fix PID OCR/typing mistakes (like M0B instead of MOB)
    cleanUrl = cleanUrl.replace(/([?&]pid=)M0B/i, "$1MOB");

    let resolvedUrl = cleanUrl;

    // Follow redirect if short link
    if (cleanUrl.includes("dl.flipkart.com") || cleanUrl.includes("fkrt.it")) {
      try {
        const headRes = await fetch(cleanUrl, {
          method: "HEAD",
          redirect: "follow",
          headers: {
            "User-Agent": BROWSER_HEADERS["User-Agent"],
          },
        });
        if (headRes.url) {
          resolvedUrl = headRes.url;
        }
      } catch (err) {
        console.warn("Could not follow shortlink redirect:", err);
      }
    }

    // Extract PID
    let pid = "";
    const pidMatch = resolvedUrl.match(/[?&]pid=([A-Z0-9]{16})/i);
    if (pidMatch) {
      pid = pidMatch[1].toUpperCase();
    }

    if (!pid) {
      // Check for /reviews/PID:xxxx permalink format
      const reviewPathMatch = resolvedUrl.match(/\/reviews\/([A-Z0-9]{16})/i);
      if (reviewPathMatch) {
        pid = reviewPathMatch[1].toUpperCase();
      }
    }

    if (!pid) {
      // Look for any alphanumeric 16-character sequence after pid=
      const genericPidMatch = resolvedUrl.match(/[?&]pid=([^&]+)/i);
      if (genericPidMatch) {
        pid = decodeURIComponent(genericPidMatch[1]).trim().toUpperCase();
      }
    }

    // Extract slug and itm
    let slug = "product";
    let itm = "itm";

    try {
      const parsed = new URL(resolvedUrl);
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length > 0 && !parts[0].startsWith("itm")) {
        slug = parts[0];
      }
      for (const part of parts) {
        if (part.startsWith("itm")) {
          itm = part;
          break;
        }
      }
    } catch {}

    if (!pid) return null;

    return {
      rawUrl,
      resolvedUrl,
      pid,
      slug,
      itm,
    };
  }

  /**
   * Recursively finds all ProductReviewValue objects from a state object
   */
  static extractReviewsFromObject(obj: any, pid: string): FlipkartReview[] {
    const reviews: FlipkartReview[] = [];
    const seenIds = new Set<string>();

    function walk(curr: any) {
      if (!curr || typeof curr !== "object") return;

      if (
        curr.type === "ProductReviewValue" ||
        (curr.author && curr.text && typeof curr.rating !== "undefined")
      ) {
        const id = curr.id || curr.reviewId || Math.random().toString();
        if (!seenIds.has(id)) {
          seenIds.add(id);

          // Extract photos
          const images: string[] = [];
          if (Array.isArray(curr.images)) {
            curr.images.forEach((img: any) => {
              const rawImgUrl = img?.value?.imageURL || img?.imageURL || "";
              if (rawImgUrl) {
                // Replace template placeholders with real dimensions
                const formatted = rawImgUrl
                  .replace(/{@width}/g, "600")
                  .replace(/{@height}/g, "600")
                  .replace(/{@quality}/g, "85");
                images.push(formatted);
              }
            });
          }

          // Format product attributes
          let attributes = "";
          if (Array.isArray(curr.productAttributeList)) {
            attributes = curr.productAttributeList
              .map((a: any) => `${a.name}: ${a.value}`)
              .join(" • ");
          }

          // Build permalink
          let permalink = "";
          if (curr.url) {
            if (curr.url.startsWith("http")) {
              permalink = curr.url;
            } else {
              permalink = `https://www.flipkart.com${curr.url.startsWith("/") ? "" : "/"}${curr.url}`;
            }
          } else {
            permalink = `https://www.flipkart.com/reviews/${pid}?reviewId=${id}`;
          }

          // Format location cleanly if object
          let locationStr = "";
          if (typeof curr.location === "string") {
            locationStr = curr.location;
          } else if (curr.location && typeof curr.location === "object") {
            locationStr = [curr.location.city, curr.location.state]
              .filter(Boolean)
              .join(", ");
          }

          reviews.push({
            id,
            rating: curr.rating || 5,
            title: curr.title || "",
            text: curr.text || "",
            name: curr.author || "Flipkart Customer",
            location: locationStr,
            date: curr.created || "",
            verified: Boolean(
              curr.certifiedBuyer ||
                curr.reviewPropertyMap?.VERIFIED_PURCHASE ||
                curr.verifiedPurchase
            ),
            images,
            helpful:
              curr.helpfulCount ||
              curr.upvote?.value?.count ||
              curr.totalCount ||
              0,
            attributes,
            permalink,
            ref: id,
          });
        }
        return;
      }

      for (const key of Object.keys(curr)) {
        walk(curr[key]);
      }
    }

    walk(obj);
    return reviews;
  }

  /**
   * Fetches product metadata (Title, photo, price, mrp, discount, rating, totalReviews)
   * Runs Flipkart review page and product page in parallel for sub-second responses.
   */
  static async fetchProductMeta(
    pid: string,
    slug: string = "product",
    itm: string = "itm"
  ): Promise<FlipkartProductMeta | null> {
    if (!pid) return null;

    let title = "";
    let imageUrl = "";
    let price: number | undefined;
    let mrp: number | undefined;
    let discount = "";
    let rating = 4.3;
    let totalReviews = 0;
    let totalRatings = 0;

    const reviewUrl = `https://www.flipkart.com/${slug}/product-reviews/${itm}?pid=${pid}&page=1`;
    const productUrl = `https://www.flipkart.com/${slug}/p/${itm}?pid=${pid}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const [revRes, prodRes] = await Promise.allSettled([
        fetch(reviewUrl, {
          headers: BROWSER_HEADERS,
          signal: controller.signal,
          next: { revalidate: 300 },
        }),
        fetch(productUrl, {
          headers: BROWSER_HEADERS,
          signal: controller.signal,
          next: { revalidate: 300 },
        }),
      ]);
      clearTimeout(timeout);

      // 1. Process Review Page (Title, Rating, Total Reviews, Total Ratings)
      if (revRes.status === "fulfilled" && revRes.value.ok) {
        const text = await revRes.value.text();
        const titleMatch = text.match(/<title>([^:]+)\s+Reviews:/i);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        const m = text.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});<\/script>/);
        if (m) {
          try {
            const json = JSON.parse(m[1]);
            const slots = json.multiWidgetState?.widgetsData?.slots || {};
            const slot2 = slots["2"]?.slotData?.widget?.data?.rating?.value;
            if (slot2) {
              totalReviews = slot2.reviewCount || totalReviews;
              totalRatings = slot2.ratingCount || totalRatings;
              rating = slot2.average || rating;
            }
          } catch {}
        }
      }

      // 2. Process Product Page (Product Photo, Pricing, MRP, Discount)
      if (prodRes.status === "fulfilled" && prodRes.value.ok) {
        const text = await prodRes.value.text();
        const ogImg = text.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
        if (ogImg) imageUrl = ogImg;

        const m = text.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});<\/script>/);
        if (m) {
          try {
            const json = JSON.parse(m[1]);
            function findPrice(o: any) {
              if (!o || typeof o !== "object") return;
              if (o.pricing) {
                if (o.pricing.finalPrice?.value) price = o.pricing.finalPrice.value;
                if (o.pricing.mrp?.value || typeof o.pricing.mrp === "number") {
                  mrp = o.pricing.mrp?.value || o.pricing.mrp;
                }
              }
              for (const k of Object.keys(o)) findPrice(o[k]);
            }
            findPrice(json);
            if (price && mrp && mrp > price) {
              discount = `${Math.round(((mrp - price) / mrp) * 100)}% off`;
            }
          } catch {}
        }
      }
    } catch {}

    if (!title && slug && slug !== "product") {
      title = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    if (!title && !imageUrl && totalReviews === 0) {
      return null;
    }

    return {
      title: title || "Marketplace Product",
      imageUrl,
      price,
      mrp,
      discount,
      rating,
      totalReviews,
      totalRatings,
    };
  }

  /**
   * High-speed Flipkart Review Page Fetcher (< 800ms direct response)
   */
  static async fetchPage(
    pid: string,
    slug: string,
    itm: string,
    page: number,
    sortOrder: string = "MOST_HELPFUL",
    certifiedBuyer: boolean = false
  ): Promise<{ reviews: FlipkartReview[]; totalReviews?: number }> {
    const cbParam = certifiedBuyer ? "&certifiedBuyer=true" : "";
    const fkUrl = `https://www.flipkart.com/${slug}/product-reviews/${itm}?pid=${pid}&sortOrder=${sortOrder}${cbParam}&page=${page}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(fkUrl, {
        headers: BROWSER_HEADERS,
        signal: controller.signal,
        next: { revalidate: 300 },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        if (html.includes("window.__INITIAL_STATE__") && !html.includes("E002")) {
          const match = html.match(
            /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});<\/script>/
          );
          if (match) {
            const state = JSON.parse(match[1]);
            const reviews = this.extractReviewsFromObject(state, pid);

            // Also check for total review count from rating widget
            let totalReviews: number | undefined;
            try {
              const slots = state.multiWidgetState?.widgetsData?.slots || {};
              const slot2 = slots["2"]?.slotData?.widget?.data?.rating?.value;
              if (slot2?.reviewCount) totalReviews = slot2.reviewCount;
            } catch {}

            return { reviews, totalReviews };
          }
        }
      }
    } catch {}

    return { reviews: [] };
  }
}
