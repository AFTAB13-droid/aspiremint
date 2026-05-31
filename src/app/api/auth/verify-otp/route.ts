import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 });
    }

    await connectToDatabase();

    // Find user with non-expired OTP slot
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user || !user.resetPasswordOTP) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    // Compare submitted OTP against stored bcrypt hash
    const isMatch = await bcrypt.compare(String(otp).trim(), user.resetPasswordOTP);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully" });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ success: false, message: "Verification failed. Please try again." }, { status: 500 });
  }
}
