import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import previousRefunds from "@/data/previousRefunds.json";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.previousRefundFetched) {
      return NextResponse.json({ success: true, eligible: false, message: "Already fetched" });
    }

    const record = previousRefunds.find(r => r.mobile.toString() === user.mobile.toString());
    if (record) {
      return NextResponse.json({ success: true, eligible: true, amount: record.amount });
    }

    return NextResponse.json({ success: true, eligible: false });

  } catch (error: any) {
    console.error("Previous refund check error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.previousRefundFetched) {
      return NextResponse.json({ success: false, message: "Already fetched" }, { status: 400 });
    }

    const record = previousRefunds.find(r => r.mobile.toString() === user.mobile.toString());
    if (record) {
      user.previousRefundFetched = true;
      user.previousRefundAmount = record.amount;
      await user.save();
      return NextResponse.json({ success: true, amount: record.amount });
    }

    return NextResponse.json({ success: false, message: "Not eligible" }, { status: 400 });

  } catch (error: any) {
    console.error("Previous refund fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
