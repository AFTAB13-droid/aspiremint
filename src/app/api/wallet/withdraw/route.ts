import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReferralService } from "@/services/referral.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, paymentMethod, upiId, bankName, accountNumber, ifscCode, accountHolder } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, message: "Invalid withdrawal amount" }, { status: 400 });
    }

    if (paymentMethod === "UPI" && (!upiId || !upiId.includes("@"))) {
      return NextResponse.json({ success: false, message: "Valid UPI ID required (e.g. name@okhdfc)" }, { status: 400 });
    }

    if (paymentMethod === "BANK" && (!accountNumber || !ifscCode)) {
      return NextResponse.json({ success: false, message: "Account number and IFSC code required" }, { status: 400 });
    }

    const result = await ReferralService.requestWithdrawal(session.user.id, Number(amount), paymentMethod, {
      upiId,
      bankName,
      accountNumber,
      ifscCode,
      accountHolder,
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully! Funds will be disbursed to your account shortly.",
      data: result,
    });
  } catch (error: any) {
    console.error("Withdrawal Request Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Withdrawal failed" }, { status: 400 });
  }
}
