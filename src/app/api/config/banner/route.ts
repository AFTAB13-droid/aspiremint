import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { SystemConfig } from "@/modules/config/config.model";

export async function GET() {
  try {
    await connectToDatabase();
    const config = await SystemConfig.findOne({ key: "global_banner" });
    return NextResponse.json({ success: true, data: config?.value || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { banner } = await req.json();
    await connectToDatabase();
    
    await SystemConfig.findOneAndUpdate(
      { key: "global_banner" },
      { value: banner },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true, message: "Banner updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
