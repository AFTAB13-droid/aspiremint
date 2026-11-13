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
 * Checks whether a deal has a missing or hidden product link.
 */
export function isMissingProductLink(deal: any): boolean {
  if (!deal) return true;
  if (!deal.productLink || typeof deal.productLink !== "string") return true;
  return deal.productLink.trim() === "";
}

/**
 * Formats the deal's payout/commission display for messaging.
 */
export function formatPayoutText(deal: any): string {
  if (!deal) return "N/A";
  if (deal.juhiCommission === undefined || deal.juhiCommission === null) return "Ask Juhi";
  if (typeof deal.juhiCommission === "string") {
    const c = deal.juhiCommission.trim().toUpperCase();
    if (c === "NA" || c === "N/A" || c === "ASK JUHI" || c === "") return "Ask Juhi";
  }
  const num = Number(deal.juhiCommission);
  if (isNaN(num)) return String(deal.juhiCommission);
  if (num === 0) return "Full Refund";
  return `${num >= 0 ? '+' : '-'}₹${Math.abs(num)}`;
}

/**
 * Clean phone number helper.
 */
function getSanitizedPhone(): string {
  const rawPhone = process.env.NEXT_PUBLIC_JUHI_WHATSAPP || JUHI_DEFAULT_WHATSAPP;
  const digits = rawPhone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

/**
 * Generates the WhatsApp universal URL to message Juhi for general deal inquiries.
 */
export function getJuhiWhatsAppUrl(deal: any, buyerId?: string): string {
  const phone = getSanitizedPhone();

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

/**
 * Generates the WhatsApp universal URL specifically requesting the PRODUCT LINK
 * for deals where the price/commission is set, but the admin has not provided a link.
 */
export function getJuhiProductLinkRequestUrl(deal: any, buyerId?: string): string {
  const phone = getSanitizedPhone();

  const brandName = deal?.brandName || "N/A";
  const productCode = deal?.productCode || deal?._id || "N/A";
  const dealType = deal?.dealType || "Original";
  const reviewType = deal?.reviewType === "SUBMITTED" 
    ? "Review Submitted" 
    : (deal?.reviewType || "Review");
  const marketplace = deal?.marketplace || "";
  const details = deal?.productDetails ? deal.productDetails.trim() : "";
  const payout = formatPayoutText(deal);

  const origin = typeof window !== "undefined" && window.location.origin 
    ? window.location.origin 
    : "https://deals.aspiremint.in";

  const messageLines = [
    `Hello Juhi, please share the *Product Link* for this deal:`,
    ``,
    `• *Brand:* ${brandName}`,
    `• *Product Code:* ${productCode}`,
    details ? `• *Product:* ${details}` : null,
    `• *Price/Payout:* ${payout}`,
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
