import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { AuditLog } from "@/modules/system/audit.model";
import "@/modules/user/user.model"; // Ensure User model is loaded for references

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUBADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized Administrative Request" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate("adminId", "name email aspireMintId role")
        .lean(),
      AuditLog.countDocuments(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("AUDIT_LOG_FETCH_ERROR:", error);
    return NextResponse.json({ success: false, message: "Failed to load audit events" }, { status: 500 });
  }
}
