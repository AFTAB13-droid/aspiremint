import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { FlipkartReviewService } from "@/services/flipkartReview.service";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url")?.trim() || "";
  const shouldDownload = searchParams.get("download") === "true";

  // Review & Product metadata
  let name = searchParams.get("name") || "";
  let rating = searchParams.get("rating") || "5";
  let title = searchParams.get("title") || "";
  let text = searchParams.get("text") || "";
  let date = searchParams.get("date") || "";
  let helpful = searchParams.get("helpful") || "113";
  let productTitle = searchParams.get("productTitle") || "";
  let productImage = searchParams.get("productImage") || "";
  const verified = searchParams.get("verified") !== "false";

  let photos: string[] = [];
  try {
    const imagesParam = searchParams.get("images");
    if (imagesParam) {
      photos = JSON.parse(imagesParam);
    }
  } catch {}

  // Resolve product info from URL if missing
  if (targetUrl) {
    try {
      const urlInfo = await FlipkartReviewService.resolveUrl(targetUrl);
      if (urlInfo?.slug && !productTitle) {
        productTitle = urlInfo.slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }

      if (!name && urlInfo?.pid) {
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
    } catch (e) {
      console.warn("Screenshot review lookup fallback error:", e);
    }
  }

  // Realistic defaults if not supplied
  if (!name) name = "Shraddha Singh";
  if (!text) text = "Overall good.nice camera \nBetter than 12.";
  if (!title) title = "Great product";
  if (!date) date = "08 Oct, 2024";
  if (!productTitle) productTitle = "Apple iPhone 15 (Black, 128 GB)";

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
              <span style={{ color: "#ffe500", fontWeight: 700 }}>Plus</span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#ffe500">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>

          {/* Desktop Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#ffffff",
              borderRadius: "2px",
              width: "480px",
              height: "36px",
              padding: "0 14px",
              boxShadow: "0 1px 2px 0 rgba(0,0,0,0.1)",
            }}
          >
            <span
              style={{
                color: "#878787",
                fontSize: "14px",
              }}
            >
              Search for products, brands and more
            </span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2874f0"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>

          {/* Nav Actions */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
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
                display: "flex",
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
              <span style={{ fontSize: "10px" }}>▼</span>
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
            fontWeight: 600,
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
            padding: "20px 40px",
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
              {productImage ? (
                <img
                  src={productImage}
                  style={{
                    maxHeight: "200px",
                    maxWidth: "200px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                /* Sleek Smartphone Graphic */
                <div
                  style={{
                    width: "130px",
                    height: "190px",
                    borderRadius: "18px",
                    border: "3px solid #1e293b",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "12px",
                      backgroundColor: "#1e293b",
                      borderRadius: "6px",
                    }}
                  />
                  <div
                    style={{
                      width: "54px",
                      height: "54px",
                      borderRadius: "9999px",
                      backgroundColor: "#e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </div>
                  <div
                    style={{
                      width: "30px",
                      height: "3px",
                      backgroundColor: "#1e293b",
                      borderRadius: "2px",
                    }}
                  />
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#212121",
                marginBottom: "6px",
                lineHeight: "1.3",
              }}
            >
              {productTitle}
            </span>

            {/* Flipkart Assured Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#2874f0",
                  color: "#ffe500",
                  fontSize: "11px",
                  fontWeight: 900,
                  fontStyle: "italic",
                  padding: "1px 5px",
                  borderRadius: "2px",
                }}
              >
                f
              </div>
              <span
                style={{
                  color: "#2874f0",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontStyle: "italic",
                }}
              >
                Assured
              </span>
            </div>

            {/* Price Tag with SVG Rupee */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "19px",
                fontWeight: 800,
                color: "#212121",
              }}
            >
              <svg
                width="14"
                height="18"
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
              <span>59,900</span>
            </div>
          </div>

          {/* Right Column: Customer Review (Exact Flipkart Desktop UI) */}
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
            {photos.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {photos.slice(0, 4).map((pUrl, idx) => (
                  <img
                    key={idx}
                    src={pUrl}
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

            {/* Reviewer Metadata Line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#878787",
                borderTop: "1px solid #f0f0f0",
                paddingTop: "14px",
                marginTop: "auto",
              }}
            >
              {/* Name, Certified Buyer Badge, Date */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontWeight: 500, color: "#878787" }}>
                  {name}
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
                        width: "13px",
                        height: "13px",
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
                    <span style={{ color: "#878787" }}>Certified Buyer</span>
                  </div>
                )}

                <span>•</span>
                <span>{date}</span>
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
                  <span>{helpful}</span>
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
                  <span>17</span>
                </div>
              </div>
            </div>

            {/* Blue link below review */}
            <span
              style={{
                color: "#2874f0",
                fontSize: "14px",
                fontWeight: 600,
                marginTop: "18px",
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
      </div>
    ),
    {
      width: 1440,
      height: 810,
    }
  );

  if (shouldDownload) {
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="flipkart-review-desktop-${Date.now()}.png"`
    );
  }

  return response;
}
