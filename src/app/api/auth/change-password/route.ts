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

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
        },
        { status: 400 }
      );
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

    // Notify user about security credential changes
    try {
      const { NotificationService } = await import("@/services/notification.service");
      const { NotificationType } = await import("@/modules/notification/notification.model");
      await NotificationService.create({
        recipient: user._id.toString(),
        type: NotificationType.SYSTEM,
        title: "Security Update: Password Changed",
        message: "Your account password was updated successfully. If this wasn't you, contact support immediately.",
        actionUrl: "/app/settings",
      });
    } catch (notifErr) {
      console.error("Failed to generate change-password notification:", notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change Password API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
