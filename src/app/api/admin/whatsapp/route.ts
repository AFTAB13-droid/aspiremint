import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWhatsAppConfigStatus,
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

    const status = await getWhatsAppConfigStatus();

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Meta WhatsApp Status API Error:', error);
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

    if (action === 'check') {
      const status = await getWhatsAppConfigStatus();
      return NextResponse.json({
        success: true,
        data: status,
      });
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
    console.error('Meta WhatsApp Action API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}
