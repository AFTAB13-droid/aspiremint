import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Order } from '@/modules/order/order.model';
import { ActiveDeal } from '@/modules/brand/deal.model';
import { User } from '@/modules/user/user.model';
import connectToDatabase from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find({ status: { $ne: 'CANCELLED' } });
    let updatedCount = 0;
    let juhiCount = 0;

    for (const order of orders) {
      const dealDoc = await ActiveDeal.findOne({ productCode: order.productCode });
      if (!dealDoc) continue;

      const mediator = await User.findById(order.mediator);
      const medName = mediator?.name?.toLowerCase() || "";
      const isJuhi = medName.includes("juhi");

      let profit = 0;

      const originalRate = dealDoc.originalCommission === "N/A" || dealDoc.originalCommission === undefined || dealDoc.originalCommission === null ? 0 : Number(dealDoc.originalCommission);

      if (isJuhi) {
        // JUHI SPECIAL LOGIC: Juhi Rate vs Original Rate
        const juhiRate = dealDoc.juhiCommission === "N/A" || dealDoc.juhiCommission === undefined || dealDoc.juhiCommission === null ? 0 : Number(dealDoc.juhiCommission);
        
        // Logic: If Less (negative), Profit = abs(Original) - abs(Juhi)
        // If Commission (positive), Profit = abs(Juhi) - abs(Original)
        if (originalRate < 0) {
           profit = Math.abs(originalRate) - Math.abs(juhiRate);
        } else {
           profit = Math.abs(juhiRate) - Math.abs(originalRate);
        }
        juhiCount++;
      } else {
        // STANDARD MEDIATOR LOGIC: User Form Less vs Mediator Rate
        const userLess = Number((order.refundDetails as any)?.lessAmount || order.lessAmount || 0);
        const mediatorRate = (() => {
           const config = dealDoc.assignedMediators?.find((m: any) => m.mediatorId?.toString() === order.mediator?.toString());
           const rawComm = config ? config.commission : dealDoc.commission;
           return rawComm === "N/A" || rawComm === undefined || rawComm === null ? 0 : Number(rawComm);
        })();

        // Logic: If Less (negative), Profit = abs(User) - abs(Admin)
        // If Commission (positive), Profit = abs(Admin) - abs(User)
        if (mediatorRate < 0) {
           profit = Math.abs(userLess) - Math.abs(mediatorRate);
        } else {
           profit = Math.abs(mediatorRate) - Math.abs(userLess);
        }
      }

      // Only update if it changed or was 0
      if (order.mediatorCommission !== profit || order.adminProfit !== (Math.abs(originalRate) - profit)) {
        order.mediatorCommission = profit;
        order.adminProfit = Math.abs(originalRate) - profit;
        await order.save();
        updatedCount++;
      }
    }

    // Record profit synchronization audit event
    const { recordAudit } = await import("@/utils/audit");
    await recordAudit(session.user.id, "SYNC_PROFITS", {
      updatedCount,
      juhiCount,
      totalCount: orders.length
    });

    return NextResponse.json({ 
      success: true, 
      message: `Sync completed. Updated ${updatedCount} orders (${juhiCount} Juhi orders).`,
      details: { total: orders.length, updated: updatedCount, juhi: juhiCount }
    });

  } catch (error: any) {
    console.error('Sync Profits Error:', error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
