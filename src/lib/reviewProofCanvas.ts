/**
 * Client-Side Instant Flipkart Review Proof Canvas Generator
 * Renders authentic Flipkart desktop review proof directly in the browser DOM Canvas.
 * Zero server load, zero timeout, 100% resilient image rendering.
 */

export interface ReviewProofData {
  authorName: string;
  rating: number | string;
  reviewTitle: string;
  reviewText: string;
  reviewDate: string;
  helpfulCount?: number | string;
  productTitle: string;
  productImageUrl: string;
  price?: number | string;
  mrp?: number | string;
  discount?: string;
}

export async function generateFlipkartProofBlob(
  data: ReviewProofData
): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("Canvas generator is only available in browser context");
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context");
  }

  // 1. Fill base background (#f1f3f6)
  ctx.fillStyle = "#f1f3f6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Official Flipkart Top Blue Navbar (#2874f0, height 56px)
  ctx.fillStyle = "#2874f0";
  ctx.fillRect(0, 0, canvas.width, 56);

  // Flipkart Logo + Explore Plus
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 900 20px sans-serif";
  ctx.fillText("Flipkart", 60, 32);

  ctx.font = "italic 700 11px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Explore", 60, 47);
  ctx.fillStyle = "#ffe500";
  ctx.fillText("Plus ★", 104, 47);

  // Search Bar (width: 480px, height: 36px, y: 10px)
  const searchX = 220;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, searchX, 10, 480, 36, 2);
  ctx.fill();

  ctx.fillStyle = "#878787";
  ctx.font = "400 13px sans-serif";
  ctx.fillText("Search for products, brands and more", searchX + 16, 33);

  // Search magnifying glass icon
  ctx.strokeStyle = "#2874f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(searchX + 454, 26, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(searchX + 458, 30);
  ctx.lineTo(searchX + 464, 36);
  ctx.stroke();

  // Top Nav Right Links
  // Login Button (width: 100px, height: 32px)
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 740, 12, 100, 32, 2);
  ctx.fill();
  ctx.fillStyle = "#2874f0";
  ctx.font = "700 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Login", 790, 33);
  ctx.textAlign = "left";

  // Become a Seller
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 13px sans-serif";
  ctx.fillText("Become a Seller", 865, 33);

  // More
  ctx.fillText("More ⌄", 995, 33);

  // Cart
  ctx.fillText("🛒 Cart", 1075, 33);

  // 3. Subheader Categories Row (height: 38px, y: 56)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 56, canvas.width, 38);
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 94);
  ctx.lineTo(canvas.width, 94);
  ctx.stroke();

  ctx.fillStyle = "#212121";
  ctx.font = "500 12px sans-serif";
  const categories = [
    "Electronics ⌄",
    "TVs & Appliances ⌄",
    "Men ⌄",
    "Women ⌄",
    "Baby & Kids ⌄",
    "Home & Furniture ⌄",
    "Sports, Books & More ⌄",
    "Flights",
    "Offer Zone",
  ];
  let catX = 60;
  for (const cat of categories) {
    ctx.fillText(cat, catX, 80);
    catX += 118;
  }

  // 4. Main White Desktop Card (x: 60, y: 106, width: 1080, height: 490)
  const cardX = 60;
  const cardY = 106;
  const cardW = 1080;
  const cardH = 490;

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, cardX, cardY, cardW, cardH, 2);
  ctx.fill();
  ctx.strokeStyle = "#e8e8e8";
  ctx.stroke();

  // Vertical Divider between Product (left) and Review (right)
  const colDividerX = cardX + 270;
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(colDividerX, cardY + 16);
  ctx.lineTo(colDividerX, cardY + cardH - 16);
  ctx.stroke();

  // LEFT COLUMN: Product Photo, Title, Pricing
  // Load and render product image
  let imageDrawn = false;
  if (data.productImageUrl) {
    try {
      const img = await loadImageAsync(data.productImageUrl);
      // Contain image within 200x200 box centered at (cardX + 135, cardY + 120)
      const maxW = 200;
      const maxH = 200;
      let drawW = img.width || maxW;
      let drawH = img.height || maxH;

      const scale = Math.min(maxW / drawW, maxH / drawH);
      drawW = drawW * scale;
      drawH = drawH * scale;

      const imgX = cardX + 135 - drawW / 2;
      const imgY = cardY + 120 - drawH / 2;
      ctx.drawImage(img, imgX, imgY, drawW, drawH);
      imageDrawn = true;
    } catch (imgErr) {
      console.warn("Client canvas direct image load failed:", imgErr);
    }
  }

  // Fallback if product image failed to load
  if (!imageDrawn) {
    const boxX = cardX + 50;
    const boxY = cardY + 25;
    ctx.strokeStyle = "#93c5fd";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    roundRect(ctx, boxX, boxY, 170, 180, 10);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#2874f0";
    ctx.font = "600 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Flipkart Product", boxX + 85, boxY + 100);
    ctx.textAlign = "left";
  }

  // Product Title (max 2 lines)
  const titleY = cardY + 245;
  ctx.fillStyle = "#212121";
  ctx.font = "500 13px sans-serif";
  const cleanTitle = data.productTitle || "Marketplace Product";
  wrapText(ctx, cleanTitle, cardX + 24, titleY, 220, 18, 2);

  // Pricing
  const priceY = cardY + 300;
  let cleanPrice = String(data.price || "").replace(/[^0-9]/g, "");
  if (!cleanPrice) cleanPrice = "499";
  const formattedPrice = "₹" + parseInt(cleanPrice, 10).toLocaleString("en-IN");

  ctx.font = "700 18px sans-serif";
  ctx.fillStyle = "#212121";
  ctx.fillText(formattedPrice, cardX + 24, priceY);

  let currentPriceOffset = cardX + 24 + ctx.measureText(formattedPrice).width + 10;

  if (data.mrp) {
    const cleanMrp = String(data.mrp).replace(/[^0-9]/g, "");
    if (cleanMrp && parseInt(cleanMrp, 10) > parseInt(cleanPrice, 10)) {
      const formattedMrp = "₹" + parseInt(cleanMrp, 10).toLocaleString("en-IN");
      ctx.font = "400 13px sans-serif";
      ctx.fillStyle = "#878787";
      ctx.fillText(formattedMrp, currentPriceOffset, priceY - 1);

      // Strike-through line across MRP
      const mrpWidth = ctx.measureText(formattedMrp).width;
      ctx.strokeStyle = "#878787";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(currentPriceOffset, priceY - 5);
      ctx.lineTo(currentPriceOffset + mrpWidth, priceY - 5);
      ctx.stroke();

      currentPriceOffset += mrpWidth + 10;
    }
  }

  if (data.discount) {
    ctx.font = "700 12px sans-serif";
    ctx.fillStyle = "#388e3c";
    ctx.fillText(data.discount, currentPriceOffset, priceY - 1);
  }

  // RIGHT COLUMN: Customer Review
  const rightX = colDividerX + 36;
  const reviewHeadingY = cardY + 44;

  ctx.fillStyle = "#212121";
  ctx.font = "700 20px sans-serif";
  ctx.fillText("Customer Review", rightX, reviewHeadingY);

  // Rating Pill + Review Title
  const ratingY = reviewHeadingY + 36;
  const numRating = parseInt(String(data.rating), 10) || 5;
  const ratingBg = numRating >= 4 ? "#388e3c" : numRating === 3 ? "#ff9f00" : "#d32f2f";

  // Green rating badge
  ctx.fillStyle = ratingBg;
  roundRect(ctx, rightX, ratingY - 15, 38, 20, 3);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 12px sans-serif";
  ctx.fillText(`${numRating} ★`, rightX + 6, ratingY);

  // Review Title
  ctx.fillStyle = "#212121";
  ctx.font = "700 15px sans-serif";
  ctx.fillText(data.reviewTitle || "Super!", rightX + 48, ratingY);

  // Review Body Text
  const bodyY = ratingY + 32;
  ctx.fillStyle = "#212121";
  ctx.font = "400 14px sans-serif";
  const bodyText = data.reviewText || "Quality meets expectations. Recommended purchase.";
  const nextLineY = wrapText(ctx, bodyText, rightX, bodyY, 700, 22, 6);

  // Reviewer Line Divider
  const metaDividerY = Math.max(nextLineY + 24, cardY + 260);
  ctx.strokeStyle = "#f0f0f0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightX, metaDividerY);
  ctx.lineTo(cardX + cardW - 36, metaDividerY);
  ctx.stroke();

  // Reviewer Information: Name . (✓) Certified Buyer  Date
  const reviewerY = metaDividerY + 28;
  ctx.fillStyle = "#878787";
  ctx.font = "500 12px sans-serif";

  const author = data.authorName || "Verified Customer";
  ctx.fillText(author, rightX, reviewerY);

  let authorOffset = rightX + ctx.measureText(author).width + 8;
  ctx.fillText("•", authorOffset, reviewerY);
  authorOffset += 12;

  // Certified Buyer green/gray checkmark circle
  ctx.fillStyle = "#878787";
  ctx.beginPath();
  ctx.arc(authorOffset + 5, reviewerY - 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 9px sans-serif";
  ctx.fillText("✓", authorOffset + 2, reviewerY - 1);

  authorOffset += 16;
  ctx.fillStyle = "#878787";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("Certified Buyer", authorOffset, reviewerY);

  authorOffset += ctx.measureText("Certified Buyer").width + 12;
  ctx.font = "400 12px sans-serif";
  ctx.fillText(data.reviewDate || "Recent Order", authorOffset, reviewerY);

  // Thumbs up / down on far right
  const helpfulCount = data.helpfulCount !== undefined ? String(data.helpfulCount) : "0";
  const thumbsRightX = cardX + cardW - 120;
  ctx.fillStyle = "#878787";
  ctx.font = "400 12px sans-serif";
  ctx.fillText(`👍 ${helpfulCount}`, thumbsRightX, reviewerY);
  ctx.fillText("👎 1", thumbsRightX + 45, reviewerY);

  // Bottom blue link
  ctx.fillStyle = "#2874f0";
  ctx.font = "600 14px sans-serif";
  ctx.fillText("View all reviews of the product", rightX, cardY + cardH - 32);

  // 5. Official Flipkart Bottom Navy Footer (y: 606, height: 69px)
  const footerY = 606;
  ctx.fillStyle = "#172337";
  ctx.fillRect(0, footerY, canvas.width, 69);

  ctx.fillStyle = "#878787";
  ctx.font = "600 10px sans-serif";
  ctx.fillText("ABOUT", 60, footerY + 22);
  ctx.fillText("HELP", 260, footerY + 22);
  ctx.fillText("CONSUMER POLICY", 440, footerY + 22);
  ctx.fillText("Mail Us: Flipkart Internet Private Limited, Bengaluru", 660, footerY + 22);

  ctx.font = "400 10px sans-serif";
  ctx.fillText("Contact Us  |  About Us  |  Careers  |  Flipkart Stories", 60, footerY + 42);
  ctx.fillText("© 2007-2026 Flipkart.com", 660, footerY + 42);

  // 6. Return as Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob produced null"));
      },
      "image/png",
      0.95
    );
  });
}

function loadImageAsync(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // If direct crossOrigin fails, try fetching via blob URL
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(fallbackImg);
          };
          fallbackImg.onerror = reject;
          fallbackImg.src = blobUrl;
        })
        .catch(reject);
    };
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4
): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + "...", x, currentY);
        return currentY;
      }
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (lineCount < maxLines && line) {
    ctx.fillText(line, x, currentY);
  }

  return currentY;
}
