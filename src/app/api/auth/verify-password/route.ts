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

    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const isMatch = await (user as any).comparePassword(password);
    
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Incorrect password" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password verified" });
  } catch (error) {
    console.error("Verify Password API Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
