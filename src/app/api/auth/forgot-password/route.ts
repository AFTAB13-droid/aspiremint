import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { sendOTPEmail } from "@/services/emailService";
import bcrypt from "bcryptjs";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- RATE LIMITING: Max 2 forgot-password requests per email per 10 minutes ---
    const rateLimitKey = `forgot_pw_rate:${normalizedEmail}`;
    const attempts = await redis.incr(rateLimitKey);
    if (attempts === 1) {
      await redis.expire(rateLimitKey, 600); // 10-minute window
    }
    if (attempts > 2) {
      return NextResponse.json({
        success: false,
        message: "Too many reset requests. Please wait before trying again."
      }, { status: 429 });
    }
    // --------------------------------------------------------------------------------

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });

    // Security: Do NOT reveal whether the email exists — always return the same message
    // This prevents email enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive a reset code shortly."
      });
    }

    // Daily Rate Limit Check (2 resets per day) — DB-level secondary guard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastRequestDate = user.lastResetRequestDate ? new Date(user.lastResetRequestDate) : null;
    if (lastRequestDate) {
      lastRequestDate.setHours(0, 0, 0, 0);
    }

    if (lastRequestDate && lastRequestDate.getTime() === today.getTime()) {
      if ((user.passwordResetCount || 0) >= 2) {
        return NextResponse.json({
          success: false,
          message: "Security Protocol: Daily reset limit reached (Max 2). Please try again after 24 hours."
        }, { status: 429 });
      }
      user.passwordResetCount = (user.passwordResetCount || 0) + 1;
    } else {
      user.passwordResetCount = 1;
      user.lastResetRequestDate = new Date();
    }

    // Generate 6-digit OTP using crypto (cryptographically secure)
    const { randomInt } = await import("crypto");
    const rawOtp = randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // --- FIX: Store HASHED OTP in DB, not plaintext ---
    const salt = await bcrypt.genSalt(8);
    const hashedOtp = await bcrypt.hash(rawOtp, salt);

    user.resetPasswordOTP = hashedOtp;   // bcrypt hash stored
    user.resetPasswordExpires = expires;
    await user.save();

    // NOTE: rawOtp is ONLY sent via email, never logged
    await sendOTPEmail(user.email, user.name, rawOtp);

    return NextResponse.json({
      success: true,
      message: "If this email is registered, you will receive a reset code shortly."
    });
  } catch (error: any) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return NextResponse.json({
      success: false,
      message: "Something went wrong. Please try again later."
    }, { status: 500 });
  }
}
