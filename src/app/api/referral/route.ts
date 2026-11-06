import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReferralService } from "@/services/referral.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const hubData = await ReferralService.getBuyerReferralHub(session.user.id);
    return NextResponse.json({ success: true, data: hubData });
  } catch (error: any) {
    console.error("Referral Hub GET Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to load referral data" }, { status: 500 });
  }
}
