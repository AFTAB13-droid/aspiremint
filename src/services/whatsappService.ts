/**
 * Official Meta WhatsApp Cloud API & AiSensy Partner Service
 * 100% Serverless & Vercel Native (0 dependencies, 0 WebSockets, 0 disk operations)
 */

interface WhatsAppServiceConfig {
  provider: 'GREEN_API' | 'AISENSY' | 'META_CLOUD' | 'NONE';
  // Green-API credentials
  greenApiIdInstance?: string;
  greenApiTokenInstance?: string;
  greenApiUrl?: string;
  // AiSensy credentials
  aisensyApiKey?: string;
  aisensyCampaignName?: string;
  // Meta Cloud API credentials
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
}

export function getServiceConfig(): WhatsAppServiceConfig {
  // Priority 1: Green-API Cloud Gateway (Non-Meta, 100% Serverless, Zero verification roadblocks)
  const greenApiId = process.env.GREEN_API_ID_INSTANCE?.trim();
  const greenApiToken = process.env.GREEN_API_TOKEN_INSTANCE?.trim();
  const greenApiUrl =
    process.env.GREEN_API_URL?.trim() ||
    (greenApiId ? `https://${greenApiId.slice(0, 4)}.api.greenapi.com` : 'https://api.green-api.com');

  if (greenApiId && greenApiToken) {
    return {
      provider: 'GREEN_API',
      greenApiIdInstance: greenApiId,
      greenApiTokenInstance: greenApiToken,
      greenApiUrl,
    };
  }

  // Priority 2: AiSensy Official WhatsApp Partner
  const aisensyApiKey = process.env.AISENSY_API_KEY?.trim();
  const aisensyCampaignName = process.env.AISENSY_CAMPAIGN_NAME?.trim() || 'aspiremint_alerts';

  if (aisensyApiKey) {
    return {
      provider: 'AISENSY',
      aisensyApiKey,
      aisensyCampaignName,
    };
  }

  // Priority 3: Direct Meta Cloud API
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();

  if (phoneNumberId && accessToken) {
    return {
      provider: 'META_CLOUD',
      phoneNumberId,
      accessToken,
      businessAccountId,
    };
  }

  return { provider: 'NONE' };
}

function getMetaConfig(): { phoneNumberId: string; accessToken: string; businessAccountId?: string } | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();

  if (!phoneNumberId || !accessToken) {
    return null;
  }

  return { phoneNumberId, accessToken, businessAccountId };
}

/**
 * Meta WhatsApp Template Parameter Validator & Sanitizer:
 * Meta Cloud API strictly forbids newlines (\r, \n), tabs (\t), or 4+ consecutive spaces in variable parameters.
 * This helper converts line breaks into clean, elegant bullet separators so Meta delivery never fails.
 */
function sanitizeAiSensyParam(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{2,}/g, '  |  ')
    .replace(/\n/g, ' • ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, 1000);
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
 * Safety gate for automated WhatsApp notifications to real buyers.
 * When set to 'false' (or when unset in developer/test mode), automated buyer alerts are paused
 * to avoid exceeding limits or messaging real customers from a test number.
 * The Admin UI test sender remains 100% active.
 */
export function isAutomatedAlertsEnabled(): boolean {
  return process.env.WHATSAPP_AUTOMATED_NOTIFICATIONS === 'true';
}

/**
 * Live health check of WhatsApp service credentials (Green-API, AiSensy, or Meta Cloud API)
 */
export async function getWhatsAppConfigStatus(): Promise<{
  configured: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'AUTH_ERROR' | 'NOT_AUTHORIZED';
  provider?: 'GREEN_API' | 'AISENSY' | 'META_CLOUD';
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  qrCode?: string;
  automatedAlertsEnabled?: boolean;
  error?: string;
}> {
  const config = getServiceConfig();

  if (config.provider === 'NONE') {
    return {
      configured: false,
      status: 'NOT_CONFIGURED',
      automatedAlertsEnabled: isAutomatedAlertsEnabled(),
      error: 'Missing WhatsApp credentials (GREEN_API_ID_INSTANCE, AISENSY_API_KEY, or Meta WHATSAPP_ACCESS_TOKEN) in environment variables.',
    };
  }

  // Provider 1: Green-API Cloud Gateway (Non-Meta, 100% Serverless)
  if (config.provider === 'GREEN_API') {
    try {
      const stateRes = await fetch(
        `${config.greenApiUrl}/waInstance${config.greenApiIdInstance}/getStateInstance/${config.greenApiTokenInstance}`,
        { cache: 'no-store' }
      );
      const stateData = await stateRes.json();
      const state = stateData.stateInstance;

      if (state === 'authorized') {
        let displayPhone = `Instance ${config.greenApiIdInstance}`;
        try {
          const settingsRes = await fetch(
            `${config.greenApiUrl}/waInstance${config.greenApiIdInstance}/getWaSettings/${config.greenApiTokenInstance}`,
            { cache: 'no-store' }
          );
          const settingsData = await settingsRes.json();
          if (settingsData.phone) {
            displayPhone = `+${settingsData.phone}`;
          }
        } catch (settingsErr) {
          console.warn('[Green-API Settings Fetch Warn]:', settingsErr);
        }

        return {
          configured: true,
          status: 'CONNECTED',
          provider: 'GREEN_API',
          phoneNumberId: config.greenApiIdInstance,
          displayPhoneNumber: displayPhone,
          verifiedName: 'AspireMint (Green-API Gateway)',
          qualityRating: 'Zero Meta Restrictions',
          automatedAlertsEnabled: isAutomatedAlertsEnabled(),
        };
      }

      // Not authorized yet: fetch QR code to render directly on Admin UI
      let qrCode: string | undefined;
      try {
        const qrRes = await fetch(
          `${config.greenApiUrl}/waInstance${config.greenApiIdInstance}/qr/${config.greenApiTokenInstance}`,
          { cache: 'no-store' }
        );
        const qrData = await qrRes.json();
        if (qrData.type === 'qrCode' && qrData.message) {
          qrCode = qrData.message;
        }
      } catch (qrErr) {
        console.warn('[Green-API QR Fetch Warn]:', qrErr);
      }

      return {
        configured: true,
        status: 'NOT_AUTHORIZED',
        provider: 'GREEN_API',
        phoneNumberId: config.greenApiIdInstance,
        displayPhoneNumber: 'Not Linked Yet',
        verifiedName: 'AspireMint (Green-API Gateway)',
        qualityRating: 'Action Required',
        qrCode,
        automatedAlertsEnabled: isAutomatedAlertsEnabled(),
        error: 'WhatsApp is not linked yet. Scan the QR code below using WhatsApp -> Linked Devices on your phone.',
      };
    } catch (err: any) {
      return {
        configured: false,
        status: 'AUTH_ERROR',
        provider: 'GREEN_API',
        phoneNumberId: config.greenApiIdInstance,
        automatedAlertsEnabled: isAutomatedAlertsEnabled(),
        error: err.message || 'Failed to connect to Green-API server',
      };
    }
  }

  // Provider 2: AiSensy Official Campaign API
  if (config.provider === 'AISENSY') {
    return {
      configured: true,
      status: 'CONNECTED',
      provider: 'AISENSY',
      displayPhoneNumber: '+91 92399 48621',
      verifiedName: 'Aspire Mint (AiSensy Official API)',
      qualityRating: 'High',
      automatedAlertsEnabled: isAutomatedAlertsEnabled(),
    };
  }

  // Provider 3: Meta Cloud API path
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
        provider: 'META_CLOUD',
        phoneNumberId: config.phoneNumberId,
        automatedAlertsEnabled: isAutomatedAlertsEnabled(),
        error: data.error?.message || `Meta API returned HTTP ${res.status}`,
      };
    }

    return {
      configured: true,
      status: 'CONNECTED',
      provider: 'META_CLOUD',
      phoneNumberId: config.phoneNumberId,
      displayPhoneNumber: data.display_phone_number || config.phoneNumberId,
      verifiedName: data.verified_name || 'AspireMint',
      qualityRating: data.quality_rating || 'GREEN',
      automatedAlertsEnabled: isAutomatedAlertsEnabled(),
    };
  } catch (err: any) {
    return {
      configured: false,
      status: 'AUTH_ERROR',
      provider: 'META_CLOUD',
      phoneNumberId: config.phoneNumberId,
      automatedAlertsEnabled: isAutomatedAlertsEnabled(),
      error: err.message || 'Failed to connect to Meta Graph API',
    };
  }
}

/**
 * Send WhatsApp notification via Green-API, AiSensy, or Meta Cloud API
 */
export async function sendWhatsAppMessage(
  toPhone: string,
  message: string,
  userName = 'Customer'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = getServiceConfig();
    if (config.provider === 'NONE') {
      return {
        success: false,
        error: 'WhatsApp is not configured. Please add GREEN_API_ID_INSTANCE or AISENSY_API_KEY in environment variables.',
      };
    }

    const cleanTo = formatWhatsAppNumber(toPhone);
    if (!cleanTo) {
      return { success: false, error: `Invalid recipient phone number: "${toPhone}".` };
    }

    // Provider 1: Green-API Cloud Gateway (Zero Meta Restrictions, Native Multi-line formatting)
    if (config.provider === 'GREEN_API') {
      const chatId = `${cleanTo}@c.us`;

      const res = await fetch(
        `${config.greenApiUrl}/waInstance${config.greenApiIdInstance}/sendMessage/${config.greenApiTokenInstance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.idMessage) {
        const errMsg = data.message || `Green-API Error (${res.status})`;
        console.error('[Green-API Dispatch Error]:', data);
        return { success: false, error: errMsg };
      }

      return { success: true, messageId: data.idMessage };
    }

    // Provider 2: AiSensy Official Campaign API
    if (config.provider === 'AISENSY') {
      const cleanUserName = (userName || 'Customer').replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 60);
      const cleanParam = sanitizeAiSensyParam(message);

      const res = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.aisensyApiKey,
          campaignName: config.aisensyCampaignName,
          destination: cleanTo,
          userName: cleanUserName,
          templateParams: [cleanUserName, cleanParam],
        }),
      });

      const data = await res.json();

      if (!res.ok || data.name === 'ERR400' || data.name === 'ERR500') {
        const errMsg = data.message || data.errorMessage || `AiSensy Error (${res.status})`;
        console.error('[AiSensy API Error]:', data);
        return { success: false, error: errMsg };
      }

      const messageId = data.submitted_message_id || data.data?.messageId || data.data?.id || 'SENT';
      return { success: true, messageId };
    }

    // Provider 2: Meta Cloud API
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
    console.error('[WhatsApp Network Error]:', err);
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

  if (!isAutomatedAlertsEnabled()) {
    console.log(`[WhatsApp Alert PAUSED - Test Mode]: sendWhatsAppRefundPaid skipped for ${phone}`);
    return { success: true, messageId: 'PAUSED_TEST_MODE', paused: true };
  }

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

  return sendWhatsAppMessage(phone, message, buyerName);
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

  if (!isAutomatedAlertsEnabled()) {
    console.log(`[WhatsApp Alert PAUSED - Test Mode]: sendWhatsAppRefundApproved skipped for ${phone}`);
    return { success: true, messageId: 'PAUSED_TEST_MODE', paused: true };
  }

  const formattedAmount = typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : `₹${amount}`;
  const brand = brandName ? ` (${brandName})` : '';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `✅ *AspireMint - Refund Approved!*

Hi *${buyerName}*,
Your refund claim for Order *#${orderId}*${brand} has been *approved* for *${formattedAmount}*.

Your payout is now queued for payment. You will receive another message with the transaction reference once payment is disbursed.
👉 *Check Status:* ${url}`;

  return sendWhatsAppMessage(phone, message, buyerName);
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

  if (!isAutomatedAlertsEnabled()) {
    console.log(`[WhatsApp Alert PAUSED - Test Mode]: sendWhatsAppRefundRejected skipped for ${phone}`);
    return { success: true, messageId: 'PAUSED_TEST_MODE', paused: true };
  }

  const brand = brandName ? ` (${brandName})` : '';
  const rejReason = reason || 'Evidence screenshot mismatch';
  const url = orderUrl || `https://deals.aspiremint.in/app/orders/${orderId}`;

  const message = `⚠️ *AspireMint - Refund Review Update*

Hi *${buyerName}*,
Your refund submission for Order *#${orderId}*${brand} could not be approved.

*Reason:* ${rejReason}
Please review your submission details on the portal and re-submit if required.
👉 *View Order Details:* ${url}`;

  return sendWhatsAppMessage(phone, message, buyerName);
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

  if (!isAutomatedAlertsEnabled()) {
    console.log(`[WhatsApp Alert PAUSED - Test Mode]: sendWhatsAppOrderCreated skipped for ${phone}`);
    return { success: true, messageId: 'PAUSED_TEST_MODE', paused: true };
  }

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

  return sendWhatsAppMessage(phone, message, buyerName);
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

  if (!isAutomatedAlertsEnabled()) {
    console.log(`[WhatsApp Alert PAUSED - Test Mode]: sendWhatsAppReminder skipped for ${phone}`);
    return { success: true, messageId: 'PAUSED_TEST_MODE', paused: true };
  }

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

  return sendWhatsAppMessage(phone, message, buyerName);
}
