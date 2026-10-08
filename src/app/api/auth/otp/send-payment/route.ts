import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { sendOTPEmail } from "@/services/emailService";
import { storeOtp } from "@/services/otpService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const userQuery = session.user.id 
      ? { _id: session.user.id } 
      : { email: session.user.email?.toLowerCase().trim() };

    const dbUser = await User.findOne(userQuery);
    const email = (dbUser?.email || session.user.email)?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ success: false, message: "User email not found" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in fail-safe OTP service (Redis + MongoDB fallback)
    const normalizedEmail = email.trim().toLowerCase();
    await storeOtp(`payment_update_otp:${normalizedEmail}`, otp, 300);

    // SIMULATED SENDING: Log to console
    console.log(`[PAYMENT SECURITY SERVICE] OTP for ${email} is: ${otp}`);

    // SEND REAL EMAIL (Non-blocking dispatch)
    await sendOTPEmail(email, session.user.name || email.split('@')[0], otp, "PAYMENT").catch(mailError => {
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
