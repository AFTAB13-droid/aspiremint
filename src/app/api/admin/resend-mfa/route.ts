import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "No active session found" }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;
    if (!email) {
      return NextResponse.json({ success: false, message: "Email not found" }, { status: 400 });
    }
    const name = session.user.name || "Admin";

    // Rate Limiting: max 3 resends per 15 minutes
    const rateLimitKey = `mfa_resend_limit:${userId}`;
    const resends = await redis.incr(rateLimitKey);
    if (resends === 1) {
      await redis.expire(rateLimitKey, 900);
    }
    if (resends > 3) {
      return NextResponse.json({ success: false, message: "Too many resend requests. Please wait 15 minutes." }, { status: 429 });
    }

    // Generate new OTP
    const { randomInt } = await import("crypto");
    const newOtp = randomInt(100000, 999999).toString();

    const mfaRedisKey = `admin_mfa_otp:${userId}`;
    await redis.set(mfaRedisKey, newOtp, { ex: 300 }); // Valid for 5 minutes

    // Send email
    const { sendOTPEmail } = await import("@/services/emailService");
    try {
      await sendOTPEmail(email, name, newOtp);
      console.log(`[MFA RESEND] Sent OTP ${newOtp} to ${email}`);
    } catch (mailError) {
      console.error("[MFA RESEND] Failed to send email:", mailError);
      console.log(`[MFA RESEND FALLBACK] Code for ${email}: ${newOtp}`);
    }

    return NextResponse.json({ success: true, message: "Security code re-dispatched" });
  } catch (error: any) {
    console.error("MFA_RESEND_ERROR:", error);
    return NextResponse.json({ success: false, message: "Internal server error during resend" }, { status: 500 });
  }
}
