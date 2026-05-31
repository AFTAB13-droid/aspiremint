import { headers } from "next/headers";
import { AuditLog } from "@/modules/system/audit.model";
import connectToDatabase from "@/lib/db";

export async function recordAudit(adminId: string, action: string, metadata?: any) {
  try {
    let ip = "Direct Node Call";
    let userAgent = "Web Request Engine";

    try {
      const headersList = headers();
      const ua = headersList.get("user-agent");
      if (ua) userAgent = ua;

      const forwardedFor = headersList.get("x-forwarded-for");
      if (forwardedFor) {
        ip = forwardedFor.split(",")[0].trim();
      } else {
        const realIp = headersList.get("x-real-ip");
        if (realIp) ip = realIp;
      }
    } catch (headerError) {
      console.warn("Audit headers capture error:", headerError);
    }

    await connectToDatabase();
    await AuditLog.create({
      adminId,
      action,
      ip,
      userAgent,
      metadata,
    });
    console.log(`[AUDIT] Action: ${action} recorded by Admin: ${adminId}`);
  } catch (error) {
    console.error("Audit log failed to record:", error);
  }
}
