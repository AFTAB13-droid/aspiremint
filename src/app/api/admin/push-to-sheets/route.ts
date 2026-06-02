import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUBADMIN')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { webAppUrl, headers, rows } = body;

    if (!webAppUrl) {
      return NextResponse.json({ success: false, message: 'Apps Script URL is missing' }, { status: 400 });
    }

    if (!headers || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ success: false, message: 'Invalid payload structure' }, { status: 400 });
    }

    // Proxy request to the Google Apps Script Web App URL
    const gasResponse = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ headers, rows }),
    });

    if (!gasResponse.ok) {
      const errorText = await gasResponse.text();
      throw new Error(`Google Apps Script responded with ${gasResponse.status}: ${errorText}`);
    }

    const gasJson = await gasResponse.json();

    // Record audit trail log
    try {
      const { recordAudit } = await import("@/utils/audit");
      const actorTitle = (session.user as any).role === "SUBADMIN" ? "SubAdmin" : "Admin";
      await recordAudit(session.user.id, "EXPORT_REPORTS", {
        actor: actorTitle,
        rowsCount: rows.length,
        sheetsUrl: webAppUrl.substring(0, 45) + "..."
      });
    } catch (auditErr) {
      console.error("Failed to write audit trail for sheets push:", auditErr);
    }

    return NextResponse.json({ success: true, data: gasJson });
  } catch (error: any) {
    console.error('Google Sheets Push Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Push transmission failed' }, { status: 500 });
  }
}
