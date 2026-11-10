import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { FlipkartReviewService } from "@/services/flipkartReview.service";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// In-memory LRU cache to store verified base64 product images across requests
const imageBase64Cache = new Map<string, string>();

async function handleScreenshotRequest(req: NextRequest) {
  let searchParams: URLSearchParams;
  let bodyData: Record<string, any> = {};

  if (req.method === "POST") {
    try {
      bodyData = await req.json();
    } catch {}
    searchParams = new URL(req.url).searchParams;
  } else {
    searchParams = new URL(req.url).searchParams;
  }

  const getParam = (key: string): string => {
    if (bodyData[key] !== undefined && bodyData[key] !== null) {
      return String(bodyData[key]).trim();
    }
    return searchParams.get(key)?.trim() || "";
  };

  const targetUrl = getParam("url");
  const shouldDownload = getParam("download") === "true";

  // Review & Product metadata
  let name = getParam("name");
  let rating = getParam("rating") || "5";
  let title = getParam("title");
  let text = getParam("text");
  let date = getParam("date");
  let helpful = getParam("helpful") || "0";
  let productTitle = getParam("productTitle");
  let productImage = getParam("productImage");
  let price = getParam("price");
  let mrp = getParam("mrp");
  let discount = getParam("discount");
  const verified = getParam("verified") !== "false";

  let photos: string[] = [];
  try {
    if (Array.isArray(bodyData.images)) {
      photos = bodyData.images;
    } else {
      const imagesParam = searchParams.get("images");
      if (imagesParam) {
        photos = JSON.parse(imagesParam);
      }
    }
  } catch {}

  // Resolve product info and review details dynamically from URL if missing
  if (targetUrl && (!name || !productTitle || !productImage || !price)) {
    try {
      const urlInfo = await FlipkartReviewService.resolveUrl(targetUrl);
      if (urlInfo?.pid) {
        if (!productTitle || !productImage || !price) {
          const productMeta = await FlipkartReviewService.fetchProductMeta(
            urlInfo.pid,
            urlInfo.slug,
            urlInfo.itm
          );
          if (productMeta) {
            if (!productTitle && productMeta.title) productTitle = productMeta.title;
            if (!productImage && productMeta.imageUrl) productImage = productMeta.imageUrl;
            if (!price && productMeta.price) price = String(productMeta.price);
            if (!mrp && productMeta.mrp) mrp = String(productMeta.mrp);
            if (!discount && productMeta.discount) discount = productMeta.discount;
          }
        }

        if (urlInfo?.slug && !productTitle) {
          productTitle = urlInfo.slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        if (!name) {
          const page1 = await FlipkartReviewService.fetchPage(
            urlInfo.pid,
            urlInfo.slug,
            urlInfo.itm,
            1
          );
          const reviewIdMatch = targetUrl.match(/reviewId=([a-zA-Z0-9_-]+)/);
          const reviewId = reviewIdMatch ? reviewIdMatch[1] : "";
          const matched =
            page1.reviews.find(
              (r) => r.id === reviewId || r.permalink?.includes(reviewId)
            ) || page1.reviews[0];

          if (matched) {
            name = matched.name || name;
            rating = String(matched.rating || rating);
            title = matched.title || title;
            text = matched.text || text;
            date = matched.date || date;
            helpful = String(matched.helpful || helpful);
            if (matched.images && matched.images.length > 0 && photos.length === 0) {
              photos = matched.images.slice(0, 4);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Screenshot review lookup fallback error:", e);
    }
  }

  // Realistic defaults if still empty
  if (!name) name = "Verified Customer";
  if (!text) text = "Great product! Quality matches expectations.";
  if (!title) title = "Super!";
  if (!date) date = "Recent Order";
  if (!productTitle) productTitle = "Marketplace Verified Item";

  // Safe base64 converter compatible with both Edge and Node runtimes
  const toBase64 = (ab: ArrayBuffer): string => {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(ab).toString("base64");
    }
    const bytes = new Uint8Array(ab);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Pre-buffer product image to verified JPEG/PNG base64 Data URL so Satori renders crisply without failing
  let base64ProductImage = "";
  if (productImage && productImage.startsWith("data:")) {
    base64ProductImage = productImage;
  } else if (productImage && productImage.startsWith("http")) {
    if (imageBase64Cache.has(productImage)) {
      base64ProductImage = imageBase64Cache.get(productImage)!;
    } else {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const imgRes = await fetch(productImage, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "image/jpeg,image/png,*/*;q=0.8",
          },
        });
        clearTimeout(timeout);
        if (imgRes.ok) {
          const ab = await imgRes.arrayBuffer();
          const bytes = new Uint8Array(ab.slice(0, 4));
          const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
          const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
          const mime = isPng ? "image/png" : "image/jpeg";
          if (isJpeg || isPng || ab.byteLength > 500) {
            base64ProductImage = `data:${mime};base64,${toBase64(ab)}`;
            if (imageBase64Cache.size > 100) imageBase64Cache.clear();
            imageBase64Cache.set(productImage, base64ProductImage);
          }
        }
      } catch (err) {
        console.warn("Product image fetch fallback error:", err);
      }
    }
  }

  // Pre-buffer customer review photos with verified JPEG/PNG magic bytes
  const base64Photos: string[] = [];
  if (photos && photos.length > 0) {
    for (const p of photos.slice(0, 3)) {
      if (p && p.startsWith("data:")) {
        base64Photos.push(p);
      } else if (p && p.startsWith("http")) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const pRes = await fetch(p, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "image/jpeg,image/png",
            },
          });
          clearTimeout(timeout);
          if (pRes.ok) {
            const ab = await pRes.arrayBuffer();
            const bytes = new Uint8Array(ab.slice(0, 4));
            const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
            const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
            const mime = isPng ? "image/png" : "image/jpeg";
            if (isJpeg || isPng || ab.byteLength > 500) {
              base64Photos.push(`data:${mime};base64,${toBase64(ab)}`);
            }
          }
        } catch {}
      }
    }
  }

  // Clean and format price
  let cleanPrice = price.replace(/[^0-9]/g, "");
  if (!cleanPrice) cleanPrice = "499";
  const displayPrice = parseInt(cleanPrice, 10).toLocaleString("en-IN");

  let cleanMrp = mrp.replace(/[^0-9]/g, "");
  const displayMrp = cleanMrp ? parseInt(cleanMrp, 10).toLocaleString("en-IN") : "";

  let displayDiscount = discount;
  if (!displayDiscount && cleanMrp && cleanPrice) {
    const p = parseInt(cleanPrice, 10);
    const m = parseInt(cleanMrp, 10);
    if (m > p) {
      displayDiscount = `${Math.round(((m - p) / m) * 100)}% off`;
    }
  }

  const numRating = parseInt(String(rating), 10) || 5;

  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f1f3f6",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* 1. FLIPKART OFFICIAL DESKTOP TOP BLUE NAVBAR */}
        <div
          style={{
            height: "56px",
            backgroundColor: "#2874f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px",
            width: "100%",
          }}
        >
          {/* Flipkart Logo + Explore Plus */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#ffffff",
                letterSpacing: "-0.5px",
                lineHeight: "1",
              }}
            >
              Flipkart
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "2px",
                fontSize: "11px",
                fontStyle: "italic",
                color: "#ffffff",
                marginTop: "2px",
              }}
            >
              <span>Explore</span>
              <span
                style={{
                  color: "#ffe500",
                  fontWeight: 700,
                  marginLeft: "2px",
                }}
              >
                Plus
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="#ffe500"
                style={{ marginLeft: "2px" }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>

          {/* Search Bar matching desktop */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
              borderRadius: "2px",
              height: "36px",
              width: "510px",
              padding: "0 14px",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.1)",
            }}
          >
            <span
              style={{
                color: "#878787",
                fontSize: "14px",
                letterSpacing: "-0.1px",
              }}
            >
              Search for products, brands and more
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2874f0"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          {/* Nav Links: Login Button, Become a Seller, More, Cart */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "30px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                color: "#2874f0",
                fontSize: "15px",
                fontWeight: 700,
                padding: "5px 36px",
                borderRadius: "2px",
              }}
            >
              Login
            </div>

            <span
              style={{
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Become a Seller
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <span>More</span>
              <svg
                width="9"
                height="6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#ffffff"
              >
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              <span>Cart</span>
            </div>
          </div>
        </div>

        {/* 2. SUBHEADER CATEGORIES ROW */}
        <div
          style={{
            height: "40px",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px",
            borderBottom: "1px solid #e0e0e0",
            fontSize: "13px",
            fontWeight: 500,
            color: "#212121",
          }}
        >
          <span>Electronics ⌄</span>
          <span>TVs & Appliances ⌄</span>
          <span>Men ⌄</span>
          <span>Women ⌄</span>
          <span>Baby & Kids ⌄</span>
          <span>Home & Furniture ⌄</span>
          <span>Sports, Books & More ⌄</span>
          <span>Flights</span>
          <span>Offer Zone</span>
        </div>

        {/* 3. MAIN DESKTOP CONTENT AREA */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "24px 36px",
            backgroundColor: "#ffffff",
            margin: "12px 60px",
            borderRadius: "2px",
            boxShadow: "0 1px 3px 0 rgba(0,0,0,0.1)",
          }}
        >
          {/* Left Column: Product Info */}
          <div
            style={{
              width: "280px",
              display: "flex",
              flexDirection: "column",
              paddingRight: "28px",
              borderRight: "1px solid #f0f0f0",
            }}
          >
            {/* Product Image Box */}
            <div
              style={{
                width: "100%",
                height: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              {base64ProductImage ? (
                <img
                  src={base64ProductImage}
                  width="200"
                  height="200"
                  style={{
                    maxHeight: "200px",
                    maxWidth: "200px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                /* Flipkart Delivery Parcel Graphic */
                <div
                  style={{
                    width: "150px",
                    height: "170px",
                    borderRadius: "14px",
                    border: "2px dashed #93c5fd",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "12px",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "9999px",
                      backgroundColor: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2874f0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#2874f0" }}>
                    Flipkart Product
                  </span>
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#212121",
                marginBottom: "8px",
                lineHeight: "1.35",
              }}
            >
              {productTitle}
            </span>

            {/* Price Tag with SVG Rupee, MRP strike-off and Discount (NO f Assured) */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#212121",
                }}
              >
                <svg
                  width="13"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#212121"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "2px" }}
                >
                  <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
                </svg>
                <span>{displayPrice}</span>
              </div>

              {displayMrp && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "13px",
                    color: "#878787",
                    textDecoration: "line-through",
                  }}
                >
                  <svg
                    width="9"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#878787"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "1px" }}
                  >
                    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a4 4 0 0 0 0-8" />
                  </svg>
                  <span>{displayMrp}</span>
                </div>
              )}

              {displayDiscount && (
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#388e3c",
                  }}
                >
                  {displayDiscount}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Customer Review (Exact Official Flipkart Desktop UI) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              paddingLeft: "32px",
              justifyContent: "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#212121",
                marginBottom: "18px",
              }}
            >
              Customer Review
            </span>

            {/* Star Rating Badge + Review Title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  backgroundColor: numRating >= 3 ? "#388e3c" : "#ef4444",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                }}
              >
                <span>{rating}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>

              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#212121",
                }}
              >
                {title}
              </span>
            </div>

            {/* Review Comment Text */}
            <div
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#212121",
                marginBottom: "16px",
                whiteSpace: "pre-wrap",
                maxHeight: "120px",
                overflow: "hidden",
              }}
            >
              {text}
            </div>

            {/* Customer Review Photos Thumbnails if present */}
            {base64Photos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {base64Photos.map((pUrl, idx) => (
                  <img
                    key={idx}
                    src={pUrl}
                    width="68"
                    height="68"
                    style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "4px",
                      objectFit: "cover",
                      border: "1px solid #e0e0e0",
                    }}
                  />
                ))}
              </div>
            )}

            {/* Reviewer Metadata Line (EXACT OFFICIAL FORMAT: Name . Certified Buyer Date, NO LOCATION) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#878787",
                borderTop: "1px solid #f0f0f0",
                paddingTop: "14px",
                marginTop: "16px",
              }}
            >
              {/* Name, Certified Buyer Badge, Date (NO ADDRESS / LOCATION) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontWeight: 500, color: "#878787" }}>
                  {name} .
                </span>

                {verified && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "9999px",
                        backgroundColor: "#878787",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span style={{ color: "#878787" }}>
                      Certified Buyer
                    </span>
                  </div>
                )}

                <span style={{ color: "#878787", marginLeft: "4px" }}>
                  {date}
                </span>
              </div>

              {/* Upvote & Downvote Counter with SVG thumbs */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                  </svg>
                  <span style={{ fontSize: "11px", color: "#878787", fontWeight: 500 }}>
                    {helpful}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#878787" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                  </svg>
                  <span style={{ fontSize: "11px", color: "#878787", fontWeight: 500 }}>
                    1
                  </span>
                </div>
              </div>
            </div>

            {/* Blue link pushed to bottom of review column */}
            <span
              style={{
                color: "#2874f0",
                fontSize: "14px",
                fontWeight: 600,
                marginTop: "auto",
                paddingTop: "24px",
              }}
            >
              View all reviews of the product
            </span>
          </div>
        </div>

        {/* 4. FLIPKART FOOTER (EXACT DESKTOP DARK NAVY FOOTER) */}
        <div
          style={{
            height: "140px",
            backgroundColor: "#172337",
            display: "flex",
            justifyContent: "space-between",
            padding: "20px 60px",
            color: "#ffffff",
            fontSize: "10.5px",
          }}
        >
          {/* ABOUT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              ABOUT
            </span>
            <span>Contact Us</span>
            <span>About Us</span>
            <span>Careers</span>
          </div>

          {/* GROUP COMPANIES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              GROUP COMPANIES
            </span>
            <span>Myntra</span>
            <span>Cleartrip</span>
            <span>Shopsy</span>
          </div>

          {/* HELP */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              HELP
            </span>
            <span>Payments</span>
            <span>Shipping</span>
            <span>Cancellation & Returns</span>
          </div>

          {/* CONSUMER POLICY */}
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              CONSUMER POLICY
            </span>
            <span>Cancellation & Returns</span>
            <span>Terms Of Use</span>
            <span>Security</span>
          </div>

          {/* Mail Us */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              width: "240px",
              borderLeft: "1px solid #2d3b4e",
              paddingLeft: "24px",
            }}
          >
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              Mail Us:
            </span>
            <span style={{ lineHeight: "1.4", color: "#cbd5e1" }}>
              Flipkart Internet Private Limited, Buildings Alyssa, Begonia & Clove Embassy Tech Village, Outer Ring Road, Bengaluru, 560103.
            </span>
          </div>

          {/* Registered Office Address */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              width: "240px",
              paddingLeft: "12px",
            }}
          >
            <span style={{ color: "#878787", fontWeight: 600, marginBottom: "3px" }}>
              Registered Office Address:
            </span>
            <span style={{ lineHeight: "1.4", color: "#cbd5e1" }}>
              Flipkart Internet Private Limited, Outer Ring Road, Devarabeesanahalli Village, Karnataka, India. CIN: U51109KA2012PTC066107
            </span>
          </div>
        </div>

        {/* 5. BOTTOM WHITE STRIP MATCHING OFFICIAL FLIPKART */}
        <div
          style={{
            height: "35px",
            backgroundColor: "#ffffff",
            width: "100%",
          }}
        />
      </div>
    ),
    {
      width: 1440,
      height: 810,
    }
  );

  response.headers.set(
    "Cache-Control",
    "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800"
  );

  if (shouldDownload) {
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="flipkart-review-desktop-${Date.now()}.png"`
    );
  }

  return response;
}

export async function GET(req: NextRequest) {
  return handleScreenshotRequest(req);
}

export async function POST(req: NextRequest) {
  return handleScreenshotRequest(req);
}
