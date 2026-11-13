/**
 * Utility functions for WhatsApp redirection and Juhi deal inquiries.
 */

export const JUHI_DEFAULT_WHATSAPP = "917001235875";

/**
 * Checks whether a given deal is configured as an "Ask Juhi" deal.
 * Deals where the payout / commission / price is set to "NA", "N/A", null, undefined,
 * or explicitly flagged as isAskJuhi require direct mediator communication with Juhi.
 */
export function isAskJuhiDeal(deal: any): boolean {
  if (!deal) return false;
  if (deal.isAskJuhi === true) return true;

  const juhiComm = deal.juhiCommission;
  if (juhiComm === undefined || juhiComm === null) return true;

  if (typeof juhiComm === "string") {
    const cleaned = juhiComm.trim().toUpperCase();
    if (cleaned === "NA" || cleaned === "N/A" || cleaned === "ASK JUHI" || cleaned === "") {
      return true;
    }
  }

  // Also check if product price or commission is set to NA
  if (typeof deal.productPrice === "string") {
    const cleanedPrice = deal.productPrice.trim().toUpperCase();
    if (cleanedPrice === "NA" || cleanedPrice === "N/A") return true;
  }

  if (typeof deal.commission === "string") {
    const cleanedComm = deal.commission.trim().toUpperCase();
    if (cleanedComm === "NA" || cleanedComm === "N/A") return true;
  }

  return false;
}

/**
 * Generates the WhatsApp universal URL to message Juhi with pre-filled deal details.
 * Phone number is sanitized and defaults to 917001235875.
 */
export function getJuhiWhatsAppUrl(deal: any, buyerId?: string): string {
  const rawPhone = process.env.NEXT_PUBLIC_JUHI_WHATSAPP || JUHI_DEFAULT_WHATSAPP;
  const digits = rawPhone.replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits;

  const brandName = deal?.brandName || "N/A";
  const productCode = deal?.productCode || deal?._id || "N/A";
  const dealType = deal?.dealType || "Original";
  const reviewType = deal?.reviewType === "SUBMITTED" 
    ? "Review Submitted" 
    : (deal?.reviewType || "Review");
  const marketplace = deal?.marketplace || "";
  const details = deal?.productDetails ? deal.productDetails.trim() : "";

  const origin = typeof window !== "undefined" && window.location.origin 
    ? window.location.origin 
    : "https://deals.aspiremint.in";

  const messageLines = [
    `Hello Juhi, please share details about this deal:`,
    ``,
    `• *Brand:* ${brandName}`,
    `• *Product Code:* ${productCode}`,
    details ? `• *Product:* ${details}` : null,
    `• *Deal Type:* ${dealType}`,
    `• *Review Type:* ${reviewType}`,
    marketplace ? `• *Marketplace:* ${marketplace}` : null,
    deal?.productCode ? `• *Deal Link:* ${origin}/app/activedeals/${deal.productCode}` : null,
    buyerId ? `• *Buyer AM-ID:* ${buyerId}` : null,
    ``,
    `Looking forward to your guidance!`
  ].filter(Boolean);

  const text = encodeURIComponent(messageLines.join("\n"));
  return `https://wa.me/${phone}?text=${text}`;
}
