import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { User } from "@/modules/user/user.model";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin role required." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const { action, orderIds, targetMediatorId, rejectionReason } = body;

    if (!action || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payload: action and orderIds are required." },
        { status: 400 }
      );
    }

    const adminName = session.user.name || "Admin Desk";

    // 1. ACTION: APPROVE
    if (action === "APPROVE") {
      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            status: OrderStatus.REFUND_APPROVED,
            "refundDetails.authorizedAt": new Date(),
          },
          $push: {
            activities: {
              action: "REFUND_APPROVED",
              message: `Admin override: Verified and approved after 30+ days in verification.`,
              performedBy: session.user.id,
              performedByName: adminName,
              timestamp: new Date(),
            },
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully approved ${result.modifiedCount} order(s).`,
        count: result.modifiedCount,
      });
    }

    // 2. ACTION: REASSIGN
    if (action === "REASSIGN") {
      if (!targetMediatorId) {
        return NextResponse.json(
          { success: false, message: "targetMediatorId is required for reassignment." },
          { status: 400 }
        );
      }

      const mediator = await User.findById(targetMediatorId).select("name systemDisplayName email mobile");
      if (!mediator) {
        return NextResponse.json({ success: false, message: "Target mediator not found." }, { status: 404 });
      }

      const medDisplayName = mediator.systemDisplayName || mediator.name || "Mediator";

      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            mediator: mediator._id,
            assignmentType: "MANUAL",
          },
          $push: {
            activities: {
              action: "MEDIATOR_REASSIGNED",
              message: `Admin reassigned to ${medDisplayName} due to 30d+ verification delay.`,
              performedBy: session.user.id,
              performedByName: adminName,
              timestamp: new Date(),
            },
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully reassigned ${result.modifiedCount} order(s) to ${medDisplayName}.`,
        count: result.modifiedCount,
      });
    }

    // 3. ACTION: REJECT
    if (action === "REJECT") {
      const reason = rejectionReason?.trim() || "Verification rejected by Admin due to invalid or unverified details.";

      const result = await Order.updateMany(
        { _id: { $in: orderIds } },
        {
          $set: {
            status: OrderStatus.REFUND_REJECTED,
            "refundDetails.rejectedAt": new Date(),
            "refundDetails.rejectionNote": reason,
          },
          $push: {
            activities: {
              action: "REFUND_REJECTED",
              message: `Admin rejected verification: ${reason}`,
              performedBy: session.user.id,
              performedByName: adminName,
              timestamp: new Date(),
            },
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully rejected ${result.modifiedCount} order(s).`,
        count: result.modifiedCount,
      });
    }

    return NextResponse.json({ success: false, message: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/admin/stuck-verifications/action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
