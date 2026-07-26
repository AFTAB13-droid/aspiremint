import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOtp, deleteOtp } from "@/services/otpService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "No active session found" }, { status: 401 });
    }

    const { otp } = await req.json();
    if (!otp || otp.length !== 6) {
      return NextResponse.json({ success: false, message: "Enter a valid 6-digit OTP code" }, { status: 400 });
    }

    const userId = session.user.id;
    const mfaRedisKey = `admin_mfa_otp:${userId}`;
    const storedOtp = await getOtp(mfaRedisKey);

    if (!storedOtp) {
      return NextResponse.json({ success: false, message: "Verification code expired or invalid" }, { status: 400 });
    }

    if (String(otp).trim() !== String(storedOtp).trim()) {
      return NextResponse.json({ success: false, message: "Invalid verification code. Please try again." }, { status: 400 });
    }

    // Success! Clear key
    deleteOtp(mfaRedisKey).catch(() => {});

    // Record audit trace for MFA clearance
    const { recordAudit } = await import("@/utils/audit");
    await recordAudit(userId, "MFA_VERIFICATION_SUCCESS", { email: session.user.email });

    return NextResponse.json({
      success: true,
      message: "Multi-Factor Authentication Approved"
    });
  } catch (error: any) {
    console.error("MFA_VERIFY_ERROR:", error);
    return NextResponse.json({ success: false, message: "Internal server verification failure" }, { status: 500 });
  }
}
