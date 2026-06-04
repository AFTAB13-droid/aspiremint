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

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, message: "Token required" }, { status: 400 });
    }

    await connectToDatabase();

    // Store token securely inside fcmTokens array without duplicates
    await User.updateOne(
      { _id: session.user.id },
      { $addToSet: { fcmTokens: token } }
    );

    return NextResponse.json({ success: true, message: "FCM Token registered successfully" });
  } catch (error) {
    console.error("FCM Token Registration Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ success: false, message: "Token required" }, { status: 400 });
    }

    await connectToDatabase();

    // Pull token from the user profile fcmTokens array
    await User.updateOne(
      { _id: session.user.id },
      { $pull: { fcmTokens: token } }
    );

    return NextResponse.json({ success: true, message: "FCM Token removed successfully" });
  } catch (error) {
    console.error("FCM Token Removal Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
