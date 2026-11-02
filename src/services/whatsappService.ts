/**
 * Official Meta WhatsApp Cloud API Service
 * 100% Serverless & Vercel Native (0 dependencies, 0 WebSockets, 0 disk operations)
 */

interface MetaWhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

function getMetaConfig(): MetaWhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return { phoneNumberId, accessToken, businessAccountId };
}

/**
 * Format any phone number into a clean E.164-like WhatsApp format without '+'
 * e.g. "09876543210" -> "919876543210", "+91 98765-43210" -> "919876543210"
 */
export function formatWhatsAppNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Live health check of Meta WhatsApp Cloud API credentials
 */
export async function getWhatsAppConfigStatus(): Promise<{
  configured: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'AUTH_ERROR';
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  error?: string;
}> {
  const config = getMetaConfig();

  if (!config) {
    return {
      configured: false,
      status: 'NOT_CONFIGURED',
      error: 'Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in environment variables.',
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${config.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating,code_verification_status`,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
        },
        cache: 'no-store',
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        configured: false,
        status: 'AUTH_ERROR',
        phoneNumberId: config.phoneNumberId,
        error: data.error?.message || `Meta API returned HTTP ${res.status}`,
      };
    }

    return {
      configured: true,
      status: 'CONNECTED',
      phoneNumberId: config.phoneNumberId,
      displayPhoneNumber: data.display_phone_number || config.phoneNumberId,
      verifiedName: data.verified_name || 'AspireMint',
      qualityRating: data.quality_rating || 'GREEN',
    };
  } catch (err: any) {
    return {
      configured: false,
      status: 'AUTH_ERROR',
      phoneNumberId: config.phoneNumberId,
      error: err.message || 'Failed to connect to Meta Graph API',
    };
  }
}

/**
 * Send standard text message via Meta Cloud API
 */
export async function sendWhatsAppMessage(
  toPhone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getMetaConfig();
    if (!config) {
      return {
        success: false,
        error: 'WhatsApp Meta API is not configured. Please add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in Vercel.',
      };
    }

    const cleanTo = formatWhatsAppNumber(toPhone);
    if (!cleanTo) {
      return { success: false, error: `Invalid recipient phone number: "${toPhone}".` };
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.error_user_msg || data.error?.message || `Meta API Error (${res.status})`;
      console.error('[Meta WhatsApp Cloud API Error]:', data.error);
      return { success: false, error: errMsg };
    }

    const messageId = data.messages?.[0]?.id || 'SENT';
    return { success: true, messageId };
  } catch (err: any) {
    console.error('[Meta WhatsApp Network Error]:', err);
    return { success: false, error: err.message || 'Network error dispatching WhatsApp message' };
  }
}

/**
 * Send pre-approved Meta Template message (Utility / Transactional)
 */
export async function sendWhatsAppTemplateMessage(
  toPhone: string,
  templateName: string,
  languageCode = 'en',
  bodyParameters: string[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getMetaConfig();
    if (!config) {
      return { success: false, error: 'Meta WhatsApp credentials missing.' };
    }

    const cleanTo = formatWhatsAppNumber(toPhone);
    if (!cleanTo) {
      return { success: false, error: `Invalid phone number: ${toPhone}` };
    }

    const components: any[] = [];
    if (bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters.map((text) => ({ type: 'text', text })),
      });
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error?.error_user_msg || data.error?.message || 'Failed to dispatch template';
      return { success: false, error: errMsg };
    }

    return { success: true, messageId: data.messages?.[0]?.id || 'SENT' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Template dispatch failed' };
  }
}

/**
 * SAFETY WRAPPER: Ensures that if Meta API is unconfigured, token expired, or rate-limited,
 * it NEVER throws, blocks the UI, or crashes order/refund transactions.
 */
export async function safeDispatchWhatsApp(fn: () => Promise<any>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn('[WhatsApp Meta Dispatcher Skipped / Failed - Non-Fatal]:', err);
  }
}

/* =========================================================================
   TRANSACTIONAL TEMPLATES FOR ASPIREMINT (Parallels emailService.ts)
   ========================================================================= */

export async function sendWhatsAppRefundPaid(params: {
  phone: string;
  buyerName: string;
  orderId: string;
  brandName?: string;
  productCode?: string;
  amount: number | string;
  paidByName: string;
  transactionId?: string;
  orderUrl?: string;
}) {
  const { phone, buyerName, orderId, brandName, amount, paidByName, transactionId, orderUrl } = params;
  if (!phone) return null;

  const formattedAmount = typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : `₹${amount}`;
  const brand = brandName ? ` (${brandName})` : '';
  const tx = transactionId || 'System Auto-gen';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `🎉 *AspireMint - Refund Paid Successfully!*

Hi *${buyerName}*,
Great news! Your refund of *${formattedAmount}* for Order *#${orderId}*${brand} has been successfully paid by *${paidByName}*.

📋 *Payment Details:*
• *Refund Amount:* ${formattedAmount}
• *Paid By:* ${paidByName}
• *Transaction ID (UTR):* ${tx}
• *Date:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST

The amount has been transferred to your registered payment method.
👉 *View Order & Details:* ${url}

_Thank you for choosing AspireMint!_`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendWhatsAppRefundApproved(params: {
  phone: string;
  buyerName: string;
  orderId: string;
  brandName?: string;
  amount: number | string;
  orderUrl?: string;
}) {
  const { phone, buyerName, orderId, brandName, amount, orderUrl } = params;
  if (!phone) return null;

  const formattedAmount = typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : `₹${amount}`;
  const brand = brandName ? ` (${brandName})` : '';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `✅ *AspireMint - Refund Approved!*

Hi *${buyerName}*,
Your refund claim for Order *#${orderId}*${brand} has been *approved* for *${formattedAmount}*.

Your payout is now queued for payment. You will receive another message with the transaction reference once payment is disbursed.
👉 *Check Status:* ${url}`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendWhatsAppRefundRejected(params: {
  phone: string;
  buyerName: string;
  orderId: string;
  brandName?: string;
  reason?: string;
  orderUrl?: string;
}) {
  const { phone, buyerName, orderId, brandName, reason, orderUrl } = params;
  if (!phone) return null;

  const brand = brandName ? ` (${brandName})` : '';
  const rejReason = reason || 'Evidence screenshot mismatch';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `⚠️ *AspireMint - Refund Review Update*

Hi *${buyerName}*,
Your refund submission for Order *#${orderId}*${brand} could not be approved.

*Reason:* ${rejReason}
Please review your submission details on the portal and re-submit if required.
👉 *View Order Details:* ${url}`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendWhatsAppOrderCreated(params: {
  phone: string;
  buyerName: string;
  orderId: string;
  brandName?: string;
  productCode?: string;
  amount: number | string;
  orderUrl?: string;
}) {
  const { phone, buyerName, orderId, brandName, productCode, amount, orderUrl } = params;
  if (!phone) return null;

  const formattedAmount = typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : `₹${amount}`;
  const brand = brandName || 'Campaign';
  const code = productCode ? ` [${productCode}]` : '';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `📦 *AspireMint - Order Logged Successfully!*

Hi *${buyerName}*,
Your order *#${orderId}* for *${brand}*${code} has been successfully registered in our campaign system.
• *Order Amount:* ${formattedAmount}

Once you receive the product and complete your review, fill out the refund form to claim your cashback refund.
👉 *Track Order:* ${url}`;

  return sendWhatsAppMessage(phone, message);
}

export async function sendWhatsAppReminder(params: {
  phone: string;
  buyerName: string;
  orderId: string;
  brandName?: string;
  amount: number | string;
  milestoneDay: 15 | 20 | 25;
  refundUrl?: string;
}) {
  const { phone, buyerName, orderId, brandName, amount, milestoneDay, refundUrl } = params;
  if (!phone) return null;

  const formattedAmount = typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : `₹${amount}`;
  const brand = brandName ? ` (${brandName})` : '';
  const url = refundUrl || `https://deals.aspiremint.in/app/refunds/fill/${orderId}`;

  let header = 'ℹ️ *AspireMint - Friendly Reminder*';
  let text = `It has been 15 days since you logged Order *#${orderId}*${brand}.`;

  if (milestoneDay === 20) {
    header = '⏳ *AspireMint - Urgent: 5 Days Left!*';
    text = `It has been 20 days since you logged Order *#${orderId}*${brand}. You have only 5 days remaining before the claim window closes.`;
  } else if (milestoneDay === 25) {
    header = '🚨 *AspireMint - Final Notice: Refund Pending!*';
    text = `It has been 25 days since you logged Order *#${orderId}*${brand}. This is your final call before the cashback window expires.`;
  }

  const message = `${header}

Hi *${buyerName}*,
${text}

Your cashback refund of *${formattedAmount}* is waiting! Submit your refund form now to receive your payout.
👉 *Submit Refund Form:* ${url}`;

  return sendWhatsAppMessage(phone, message);
}
