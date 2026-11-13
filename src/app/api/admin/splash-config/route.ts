import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { SystemConfig } from "@/modules/config/config.model";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  activeOption: "option1", // option1, option2, option3, option4, legacy
  soundEnabled: true,
  duration: 2500,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectToDatabase();
    const configDoc = await SystemConfig.findOne({ key: "splash_settings" }).lean();

    return NextResponse.json({
      success: true,
      config: configDoc?.value || DEFAULT_CONFIG,
    });
  } catch (error: any) {
    console.error("GET /api/admin/splash-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { activeOption, soundEnabled, duration } = body;

    if (!["option1", "option2", "option3", "option4", "legacy"].includes(activeOption)) {
      return NextResponse.json({ success: false, message: "Invalid splash option" }, { status: 400 });
    }

    await connectToDatabase();

    const updatedConfig = {
      activeOption,
      soundEnabled: soundEnabled !== undefined ? Boolean(soundEnabled) : true,
      duration: duration || 2500,
      updatedBy: session.user.id,
      updatedAt: new Date().toISOString(),
    };

    await SystemConfig.findOneAndUpdate(
      { key: "splash_settings" },
      { $set: { value: updatedConfig } },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: `Active splash updated to ${activeOption}`,
      config: updatedConfig,
    });
  } catch (error: any) {
    console.error("POST /api/admin/splash-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
