import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { SystemConfig } from "@/modules/config/config.model";

export const dynamic = "force-dynamic";

const DEFAULT_CONFIG = {
  activeOption: "option1",
  soundEnabled: true,
  duration: 2500,
};

export async function GET() {
  try {
    await connectToDatabase();
    const configDoc = await SystemConfig.findOne({ key: "splash_settings" }).lean();
    return NextResponse.json({
      success: true,
      config: configDoc?.value || DEFAULT_CONFIG,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      config: DEFAULT_CONFIG,
    });
  }
}
