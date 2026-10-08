import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { sendOTPEmail } from "@/services/emailService";
import { checkRateLimit, storeOtp } from "@/services/otpService";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { newEmail } = await req.json();

    if (!newEmail || typeof newEmail !== "string") {
      return NextResponse.json({ success: false, message: "New email address is required" }, { status: 400 });
    }

    const normalizedNewEmail = newEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedNewEmail)) {
      return NextResponse.json({ success: false, message: "Please provide a valid email address" }, { status: 400 });
    }

    await connectToDatabase();

    const userQuery = session.user.id 
      ? { _id: session.user.id } 
      : { email: session.user.email?.toLowerCase().trim() };

    const currentUser = await User.findOne(userQuery);
    if (!currentUser) {
      return NextResponse.json({ success: false, message: "User account not found" }, { status: 404 });
    }

    if (currentUser.email.toLowerCase().trim() === normalizedNewEmail) {
      return NextResponse.json({
        success: false,
        message: "The new email cannot be the same as your current email address."
      }, { status: 400 });
    }

    // Check if new email is already in use by another user
    const existingUser = await User.findOne({
      email: normalizedNewEmail,
      _id: { $ne: currentUser._id }
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: "This email address is already registered to another account."
      }, { status: 400 });
    }

    // Rate Limiting: Max 3 OTP requests per 10 minutes for this user
    const rateLimitKey = `email_change_rate:${currentUser._id.toString()}`;
    const { allowed, waitMins } = await checkRateLimit(rateLimitKey, 3, 600);
    if (!allowed) {
      return NextResponse.json({
        success: false,
        message: `Too many OTP requests. Please wait ${waitMins} minute(s) before trying again.`
      }, { status: 429 });
    }

    // Generate cryptographic 6-digit OTP
    const { randomInt } = await import("crypto");
    const otp = randomInt(100000, 999999).toString();

    // Store in fail-safe OTP service (Redis + MongoDB TTL backup)
    const storePayload = JSON.stringify({
      otp,
      newEmail: normalizedNewEmail
    });
    await storeOtp(`email_change_otp:${currentUser._id.toString()}`, storePayload, 600);

    // Send verification code directly to the NEW email address
    try {
      await sendOTPEmail(normalizedNewEmail, currentUser.name, otp, "EMAIL_CHANGE");
    } catch (mailError) {
      console.error("[Email Change] Error dispatching verification code email:", mailError);
      return NextResponse.json({
        success: false,
        message: "Failed to dispatch verification email. Please verify SMTP configuration."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent successfully to ${normalizedNewEmail}. Please check your inbox.`
    });
  } catch (error: any) {
    console.error("[Email Change Send OTP API Error]:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error while processing email change request"
    }, { status: 500 });
  }
}
