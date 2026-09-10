import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { checkAndSendRefundReminders } from "@/services/refundReminderService";

/**
 * Dedicated Cron / Trigger Endpoint for 20-Day Refund Reminders
 * Invoked to scan orders in REFUND_FORM_PENDING after 20 days and send emails warning 5 days remain.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";

    const result = await checkAndSendRefundReminders(force);
    return NextResponse.json({
      success: true,
      message: "Refund reminder processing completed",
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[Cron Refund Reminders Error]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to process refund reminders"
      },
      { status: 500 }
    );
  }
}
