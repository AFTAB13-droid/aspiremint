import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { sendOTPEmail } from "@/services/emailService";

export async function POST(req: Request) {
  try {
    const { email, mobile } = await req.json();

    if (!email || !mobile) {
      return NextResponse.json({ success: false, message: "Email and mobile are required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- RATE LIMITING: Max 3 OTP requests per email per 10 minutes ---
    const rateLimitKey = `otp_rate:${normalizedEmail}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 600); // 10-minute window
    }
    if (attempts > 3) {
      const ttl = await redis.ttl(rateLimitKey);
      const waitMins = Math.ceil(ttl / 60);
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

    // Store in Redis with 5-minute expiry
    await redis.set(`signup_otp:${normalizedEmail}`, otp, { ex: 300 });

    // NOTE: OTP is NOT logged to console — it is only sent via email
    try {
      await sendOTPEmail(email, email.split("@")[0], otp);
    } catch (mailError) {
      console.error("Signup Mail Transmission Error:", mailError);
      return NextResponse.json({
        success: false,
        message: "Failed to transmit security code. Please check your email address."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email."
    });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
