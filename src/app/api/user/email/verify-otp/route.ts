import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { getOtp, deleteOtp } from "@/services/otpService";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { newEmail, otp } = await req.json();

    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json({ success: false, message: "New email address is required" }, { status: 400 });
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ success: false, message: "Verification OTP code is required" }, { status: 400 });
    }

    const normalizedNewEmail = newEmail.trim().toLowerCase();
    const cleanOtp = otp.trim();

    await connectToDatabase();

    const userQuery = session.user.id 
      ? { _id: session.user.id } 
      : { email: session.user.email?.toLowerCase().trim() };

    const currentUser = await User.findOne(userQuery);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User account not found" }, { status: 404 });
    }

    const otpKey = `email_change_otp:${currentUser._id.toString()}`;
    const storedDataRaw = await getOtp(otpKey);

    if (!storedDataRaw) {
      return NextResponse.json({
        success: false,
        message: "Verification code has expired or was not requested. Please request a new code."
      }, { status: 400 });
    }

    let parsedData: { otp: string; newEmail: string };
    if (typeof storedDataRaw === "object" && storedDataRaw !== null) {
      parsedData = storedDataRaw as any;
    } else {
      try {
        parsedData = typeof storedDataRaw === "string" ? JSON.parse(storedDataRaw) : storedDataRaw;
      } catch (parseErr) {
        console.error("[Email Change OTP Parse Error]:", parseErr, "Raw data:", storedDataRaw);
        return NextResponse.json({
          success: false,
          message: "Corrupted verification session. Please request a new code."
        }, { status: 400 });
      }
    }

    if (!parsedData || !parsedData.otp || !parsedData.newEmail) {
      return NextResponse.json({
        success: false,
        message: "Corrupted verification session. Please request a new code."
      }, { status: 400 });
    }

    if (parsedData.newEmail.toLowerCase().trim() !== normalizedNewEmail) {
      return NextResponse.json({
        success: false,
        message: "Email mismatch. This verification code was issued for a different email address."
      }, { status: 400 });
    }

    if (String(parsedData.otp).trim() !== cleanOtp) {
      return NextResponse.json({
        success: false,
        message: "Invalid verification code. Please check your inbox and try again."
      }, { status: 400 });
    }

    // Safety check against race condition: ensure new email hasn't been claimed in the meantime
    const duplicateUser = await User.findOne({
      email: normalizedNewEmail,
      _id: { $ne: currentUser._id }
    });

    if (duplicateUser) {
      return NextResponse.json({
        success: false,
        message: "This email address was recently registered by another account."
      }, { status: 400 });
    }

    const previousEmail = currentUser.email;

    // Update primary email on User document
    currentUser.email = normalizedNewEmail;
    await currentUser.save();

    // Invalidate consumed OTP
    deleteOtp(otpKey).catch(() => {});

    // Cascade update: Synchronize buyerEmail across all existing buyer orders
    try {
      const { Order } = await import("@/modules/order/order.model");
      const orderSyncResult = await Order.updateMany(
        { buyer: currentUser._id },
        { $set: { buyerEmail: normalizedNewEmail } }
      );
      console.log(`[Email Change] Synchronized ${orderSyncResult.modifiedCount} orders with new buyerEmail: ${normalizedNewEmail}`);
    } catch (orderSyncErr) {
      console.error("[Email Change] Error syncing orders buyerEmail:", orderSyncErr);
    }

    // In-App Notification: Notify user in their notification center
    try {
      const { NotificationService } = await import("@/services/notification.service");
      const { NotificationType } = await import("@/modules/notification/notification.model");

      await NotificationService.create({
        recipient: currentUser._id.toString(),
        type: NotificationType.SYSTEM,
        title: "Account Email Updated",
        message: `Your account email address has been updated to ${normalizedNewEmail}. All order notifications, refund alerts, and system emails will now be sent here.`,
        actionUrl: "/app/settings",
      });
    } catch (notifErr) {
      console.warn("[Email Change] In-app notification creation bypassed:", notifErr);
    }

    // Security Alert: Send alert to the previous email
    try {
      const { sendEmailChangeNotice } = await import("@/services/emailService");
      await sendEmailChangeNotice(previousEmail, normalizedNewEmail, currentUser.name);
    } catch (noticeErr) {
      console.warn("[Email Change] Security notice to previous email bypassed:", noticeErr);
    }

    // Audit Log
    try {
      const { recordAudit } = await import("@/utils/audit");
      await recordAudit(currentUser._id.toString(), "USER_EMAIL_UPDATED", {
        oldEmail: previousEmail,
        newEmail: normalizedNewEmail
      });
    } catch (auditErr) {
      console.warn("[Email Change] Audit logging bypassed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Email address successfully updated. All future notifications and emails will be sent to your new email.",
      email: normalizedNewEmail
    });
  } catch (error: any) {
    console.error("[Email Change Verify OTP API Error]:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error while verifying email change code"
    }, { status: 500 });
  }
}
