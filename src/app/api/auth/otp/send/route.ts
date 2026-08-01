import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { sendOTPEmail } from "@/services/emailService";
import { checkRateLimit, storeOtp } from "@/services/otpService";

export async function POST(req: Request) {
  try {
    const { email, mobile } = await req.json();

    if (!email || !mobile) {
      return NextResponse.json({ success: false, message: "Email and mobile are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- RATE LIMITING: Max 3 OTP requests per email per 10 minutes (Fail-Safe) ---
    const rateLimitKey = `otp_rate:${normalizedEmail}`;
    const { allowed, waitMins } = await checkRateLimit(rateLimitKey, 3, 600);
    if (!allowed) {
      return NextResponse.json({
        success: false,
        message: `Too many OTP requests. Please wait ${waitMins} minute(s) before trying again.`
      }, { status: 429 });
    }
    // --------------------------------------------------------------------

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile: mobile }
      ]
    });

    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email or Mobile already registered" }, { status: 400 });
    }

    // Generate 6-digit OTP using crypto for cryptographic security
    const { randomInt } = await import("crypto");
    const otp = randomInt(100000, 999999).toString();

    // Store in fail-safe OTP service (Redis with automatic MongoDB backup)
    await storeOtp(`signup_otp:${normalizedEmail}`, otp, 300);

    // NOTE: Awaiting OTP email to ensure serverless platforms (Vercel) do not kill the container before transport
    await sendOTPEmail(email, email.split("@")[0], otp).catch(mailError => {
      console.error("Signup Mail Transmission Error:", mailError);
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email."
    });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
