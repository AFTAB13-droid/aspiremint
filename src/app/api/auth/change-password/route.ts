import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Verify old password
    const isMatch = await (user as any).comparePassword(oldPassword);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Incorrect current password" }, { status: 400 });
    }

    // Update password
    user.password = newPassword;
    user.securitySettings = {
      ...user.securitySettings,
      lastPasswordChange: new Date(),
    } as any;

    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change Password API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
