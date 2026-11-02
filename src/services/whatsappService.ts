import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';

// Dynamic import types
type WASocket = any;

interface WhatsAppClientState {
  socket: WASocket | null;
  status: 'DISCONNECTED' | 'INITIALIZING' | 'WAITING_FOR_QR' | 'WAITING_FOR_PAIRING' | 'CONNECTED';
  qrCodeDataUrl: string | null;
  pairingCode: string | null;
  connectedNumber: string | null;
  connectedName: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  isStarting: boolean;
  authDir: string;
}

// Global singleton so hot-reloads and multiple Next.js API requests share the exact same socket
const globalWithWhatsApp = global as unknown as {
  __aspire_whatsapp_state?: WhatsAppClientState;
};

const AUTH_DIR = path.join(process.cwd(), 'whatsapp_auth');

function getWhatsAppState(): WhatsAppClientState {
  if (!globalWithWhatsApp.__aspire_whatsapp_state) {
    if (!fs.existsSync(AUTH_DIR)) {
      try {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      } catch (e) {
        console.error('Failed to create whatsapp_auth dir:', e);
      }
    }

    globalWithWhatsApp.__aspire_whatsapp_state = {
      socket: null,
      status: 'DISCONNECTED',
      qrCodeDataUrl: null,
      pairingCode: null,
      connectedNumber: null,
      connectedName: null,
      lastConnectedAt: null,
      lastError: null,
      isStarting: false,
      authDir: AUTH_DIR,
    };
  }
  return globalWithWhatsApp.__aspire_whatsapp_state;
}

/**
 * Clean and format any international or Indian phone number into a WhatsApp JID
 */
export function formatWhatsAppJid(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Remove leading 0 (e.g. 09876543210 -> 9876543210)
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  // If 10 digits, assume India (+91)
  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  // Must have reasonable length for mobile (at least 10-15 digits)
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return `${digits}@s.whatsapp.net`;
}

/**
 * Initialize or get active WhatsApp socket connection
 */
export async function initWhatsApp(forceReconnect = false): Promise<WhatsAppClientState> {
  const state = getWhatsAppState();

  if (state.socket && state.status === 'CONNECTED' && !forceReconnect) {
    return state;
  }

  if (state.isStarting && !forceReconnect) {
    return state;
  }

  state.isStarting = true;
  state.status = 'INITIALIZING';
  state.lastError = null;

  try {
    const {
      default: makeWASocket,
      DisconnectReason,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
      makeCacheableSignalKeyStore,
    } = await import('@whiskeysockets/baileys');
    const pino = (await import('pino')).default;

    if (forceReconnect && state.socket) {
      try {
        state.socket.end(undefined);
      } catch {}
      state.socket = null;
    }

    const { state: authState, saveCreds } = await useMultiFileAuthState(state.authDir);

    let version: [number, number, number] = [2, 3000, 1015901307];
    try {
      const fetched = await fetchLatestBaileysVersion();
      if (fetched?.version) version = fetched.version;
    } catch {}

    const socket = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: {
        creds: authState.creds,
        keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: 'silent' })),
      },
      generateHighQualityLinkPreview: true,
      browser: ['AspireMint Gateway', 'Chrome', '124.0.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
    });

    state.socket = socket;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        state.status = 'WAITING_FOR_QR';
        try {
          state.qrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: { dark: '#0b141a', light: '#ffffff' },
          });
        } catch (qrErr) {
          console.error('Failed to generate QR data URL:', qrErr);
        }
      }

      if (connection === 'open') {
        state.status = 'CONNECTED';
        state.qrCodeDataUrl = null;
        state.pairingCode = null;
        state.lastConnectedAt = new Date().toISOString();
        state.lastError = null;
        state.isStarting = false;

        const jid = socket.user?.id || '';
        const num = jid.split(':')[0] || jid.split('@')[0];
        state.connectedNumber = num ? `+${num}` : 'Connected Device';
        state.connectedName = socket.user?.name || 'AspireMint WhatsApp';
        console.log(`[WhatsApp Service] Connected successfully as ${state.connectedNumber}`);
      }

      if (connection === 'close') {
        state.isStarting = false;
        state.status = 'DISCONNECTED';
        state.qrCodeDataUrl = null;
        state.pairingCode = null;

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        if (isLoggedOut) {
          state.lastError = 'Account logged out from phone. Please reconnect.';
          state.connectedNumber = null;
          state.connectedName = null;
          try {
            fs.rmSync(state.authDir, { recursive: true, force: true });
          } catch {}
          console.warn('[WhatsApp Service] Session logged out by client.');
        } else {
          state.lastError = (lastDisconnect?.error as Error)?.message || 'Connection closed temporarily.';
          console.log('[WhatsApp Service] Connection closed, will auto-reconnect if needed.');
        }
      }
    });

    state.isStarting = false;
    return state;
  } catch (error: any) {
    state.isStarting = false;
    state.status = 'DISCONNECTED';
    state.lastError = error.message || 'Initialization failed';
    console.error('[WhatsApp Service Init Error]:', error);
    return state;
  }
}

/**
 * Request an 8-digit pairing code for remote connection without camera/QR code
 */
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<{ success: boolean; code?: string; error?: string }> {
  try {
    let digits = phoneNumber.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.substring(1);
    if (digits.length === 10) digits = `91${digits}`;

    if (digits.length < 10 || digits.length > 15) {
      return { success: false, error: 'Invalid phone number length. Please include full country code (e.g. 919876543210).' };
    }

    // Force fresh socket initialized without an open session
    await initWhatsApp(true);
    const state = getWhatsAppState();

    if (!state.socket) {
      return { success: false, error: 'Socket is not ready. Try again in 5 seconds.' };
    }

    // Give socket 1.5 seconds to establish basic transport
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (typeof state.socket.requestPairingCode !== 'function') {
      return { success: false, error: 'Pairing code is not supported by current Baileys version.' };
    }

    const rawCode = await state.socket.requestPairingCode(digits);
    const formattedCode = rawCode?.match(/.{1,4}/g)?.join('-') || rawCode;

    state.pairingCode = formattedCode;
    state.status = 'WAITING_FOR_PAIRING';
    state.qrCodeDataUrl = null;

    return { success: true, code: formattedCode };
  } catch (err: any) {
    console.error('[WhatsApp Pairing Code Error]:', err);
    return { success: false, error: err.message || 'Failed to request pairing code' };
  }
}

/**
 * Disconnect and unlink current WhatsApp session
 */
export async function disconnectWhatsApp(): Promise<{ success: boolean; message: string }> {
  const state = getWhatsAppState();
  try {
    if (state.socket) {
      try {
        await state.socket.logout();
      } catch {}
      try {
        state.socket.end(undefined);
      } catch {}
      state.socket = null;
    }

    if (fs.existsSync(state.authDir)) {
      try {
        fs.rmSync(state.authDir, { recursive: true, force: true });
      } catch {}
    }

    state.status = 'DISCONNECTED';
    state.qrCodeDataUrl = null;
    state.pairingCode = null;
    state.connectedNumber = null;
    state.connectedName = null;
    state.lastError = null;

    return { success: true, message: 'WhatsApp session unlinked successfully.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to disconnect.' };
  }
}

/**
 * Return current status for Admin UI
 */
export function getWhatsAppStatus() {
  const state = getWhatsAppState();
  return {
    status: state.status,
    qrCodeDataUrl: state.qrCodeDataUrl,
    pairingCode: state.pairingCode,
    connectedNumber: state.connectedNumber,
    connectedName: state.connectedName,
    lastConnectedAt: state.lastConnectedAt,
    lastError: state.lastError,
  };
}

/**
 * Send raw text message (Non-blocking and safe)
 */
export async function sendWhatsAppMessage(toPhone: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const state = getWhatsAppState();
    if (state.status !== 'CONNECTED' || !state.socket) {
      return {
        success: false,
        error: 'WhatsApp is not connected. Please connect your phone from Admin > WhatsApp Gateway.',
      };
    }

    const jid = formatWhatsAppJid(toPhone);
    if (!jid) {
      return { success: false, error: `Invalid recipient phone number: "${toPhone}".` };
    }

    const result = await state.socket.sendMessage(jid, { text });
    return { success: true, messageId: result?.key?.id || 'SENT' };
  } catch (err: any) {
    console.error('[WhatsApp send error]:', err);
    return { success: false, error: err.message || 'Failed to dispatch message.' };
  }
}

/**
 * SAFETY WRAPPER: Ensures that if WhatsApp is offline, blocked, or fails,
 * it NEVER throws an unhandled rejection, blocks database updates, or stops the order flow.
 */
export async function safeDispatchWhatsApp(fn: () => Promise<any>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.warn('[WhatsApp Notification Skipped / Failed - Non-Fatal]:', err);
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
