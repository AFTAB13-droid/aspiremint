import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 });
    }

    await connectToDatabase();

    // Find user with non-expired OTP slot
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user || !user.resetPasswordOTP) {
      return NextResponse.json({ success: false, message: "Session expired or invalid" }, { status: 400 });
    }

    // Compare submitted OTP against stored bcrypt hash
    const isMatch = await bcrypt.compare(String(otp).trim(), user.resetPasswordOTP);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Session expired or invalid" }, { status: 400 });
    }

    // Set new password — pre-save hook handles bcrypt hashing
    user.password = password;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;

    if (!user.securitySettings) {
      user.securitySettings = {
        twoFactorEnabled: false,
        loginHistory: [],
      };
    }
    user.securitySettings.lastPasswordChange = new Date();

    await user.save();

    return NextResponse.json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
