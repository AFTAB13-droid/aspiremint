import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { checkAndSendRefundReminders } from "@/services/refundReminderService";

/**
 * Dedicated Cron / Trigger Endpoint for Multi-Milestone (15, 20, 25 Days) Refund Reminders
 * Invoked to scan orders in REFUND_FORM_PENDING after 15, 20, and 25 days and send reminder emails.
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
