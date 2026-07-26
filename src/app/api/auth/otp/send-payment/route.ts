import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendOTPEmail } from "@/services/emailService";
import { storeOtp } from "@/services/otpService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in fail-safe OTP service (Redis + MongoDB fallback)
    const normalizedEmail = email.trim().toLowerCase();
    await storeOtp(`payment_update_otp:${normalizedEmail}`, otp, 300);

    // SIMULATED SENDING: Log to console
    console.log(`[PAYMENT SECURITY SERVICE] OTP for ${email} is: ${otp}`);

    // SEND REAL EMAIL (Non-blocking dispatch)
    sendOTPEmail(email, session.user.name || email.split('@')[0], otp, "PAYMENT").catch(mailError => {
      console.error("Payment OTP Mail Transmission Error:", mailError);
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Security code sent to your registered email for payment update." 
    });
  } catch (error) {
    console.error("Payment OTP Send Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
