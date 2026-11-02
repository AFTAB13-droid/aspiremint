import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  initWhatsApp,
  getWhatsAppStatus,
  waitForQRCode,
  requestWhatsAppPairingCode,
  disconnectWhatsApp,
  sendWhatsAppMessage,
} from '@/services/whatsappService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'ADMIN' && role !== 'SUBADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let currentStatus = getWhatsAppStatus();

    // If completely disconnected and not initializing, trigger background init
    if (currentStatus.status === 'DISCONNECTED') {
      initWhatsApp().catch((err) => console.error('Background WhatsApp init error:', err));
      await waitForQRCode(3000);
    } else if (currentStatus.status === 'INITIALIZING' && !currentStatus.qrCodeDataUrl) {
      await waitForQRCode(3000);
    }

    return NextResponse.json({
      success: true,
      data: getWhatsAppStatus(),
    });
  } catch (error: any) {
    console.error('WhatsApp Status API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== 'ADMIN' && role !== 'SUBADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'init' || action === 'refresh_qr') {
      await initWhatsApp(true);
      await waitForQRCode(7000);
      return NextResponse.json({
        success: true,
        data: getWhatsAppStatus(),
      });
    }

    if (action === 'pair') {
      const { phoneNumber } = body;
      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, message: 'Phone number is required for pairing code.' },
          { status: 400 }
        );
      }
      const pairResult = await requestWhatsAppPairingCode(phoneNumber);
      return NextResponse.json(pairResult);
    }

    if (action === 'disconnect') {
      const result = await disconnectWhatsApp();
      return NextResponse.json(result);
    }

    if (action === 'send-test') {
      const { toPhone, message } = body;
      if (!toPhone || !message) {
        return NextResponse.json(
          { success: false, message: 'Recipient phone and message text are required.' },
          { status: 400 }
        );
      }

      const sendResult = await sendWhatsAppMessage(toPhone, message);
      return NextResponse.json(sendResult);
    }

    return NextResponse.json({ success: false, message: `Unknown action "${action}"` }, { status: 400 });
  } catch (error: any) {
    console.error('WhatsApp Action API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
