import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ActiveDeal } from '@/modules/brand/deal.model';
import { Brand } from '@/modules/brand/brand.model';
import { CACHE_KEYS, invalidateDealsCache, getCache, setCache } from '@/lib/redis';

const parsePayoutValue = (val: any) => {
  if (val === undefined || val === null || val === "" || String(val).trim().toUpperCase() === "N/A") {
    return "N/A";
  }
  const num = Number(val);
  return isNaN(num) ? "N/A" : num;
};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const productCode = searchParams.get('productCode');
    const statusFilter = searchParams.get('status') || 'active';
    
    await connectToDatabase();

    const isJuhi = user.name?.toLowerCase().includes("juhi");
    const isAdmin = user.role === 'ADMIN' || isJuhi;

    let deals: any[] | null = null;
    
    if (statusFilter === 'active') {
      // --- Resilient Cache-Aside Pattern ---
      deals = await getCache<any[]>(CACHE_KEYS.ACTIVE_DEALS);
      
      if (!deals) {
        console.log("Redis Cache Miss - Fetching active deals from MongoDB");
        deals = await ActiveDeal.find({ isActive: true }).sort({ createdAt: -1 }).lean();
        
        // Populate cache asynchronously for future hits (TTL 1 hour)
        if (deals && deals.length > 0) {
          setCache(CACHE_KEYS.ACTIVE_DEALS, deals, 3600);
        }
      } else {
        console.log("Redis Cache Hit - Active Deals loaded successfully");
      }
    } else {
      // Bypass cache for specific status requests (admin only)
      if (!isAdmin) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      
      let query: any = {};
      if (statusFilter === 'archived') query.isActive = false;
      
      deals = await ActiveDeal.find(query).sort({ createdAt: -1 }).lean();
    }

    // Apply Filters & Search In-Memory for Speed
    if (productCode) {
      deals = deals.filter(d => d.productCode === productCode);
    }

    if (user.role === 'MEDIATOR' && !isJuhi) {
      deals = deals.filter(deal => 
        deal.assignedMediators?.some((m: any) => m.mediatorId?.toString() === user.id || m.isAll)
      );
    }
    
    // Sanitize Payouts and Filter for Visibility
    const sanitizedDeals = deals
      .filter((deal: any) => {
        // If not Admin, hide deals with zero inventory
        if (!isAdmin && (deal.remainingSlots || 0) <= 0) return false;
        return true;
      })
      .map((deal: any) => {
        let displayPayout: any = "N/A";
        if (user.role === 'MEDIATOR') {
          const medConfig = deal.assignedMediators?.find((m: any) => m.mediatorId?.toString() === user.id);
          displayPayout = medConfig ? medConfig.commission : deal.commission;
        } else {
          displayPayout = deal.assignedMediators?.[0]?.commission;
          if (displayPayout === undefined || displayPayout === null) displayPayout = deal.commission;
        }
        
        if (isJuhi) {
          displayPayout = deal.juhiCommission;
        }

        // Keep raw values or default to N/A
        if (displayPayout === undefined || displayPayout === null) displayPayout = "N/A";
        
        // Final object depends on role
        return { 
          ...deal, 
          commission: isAdmin ? deal.commission : undefined,
          productImage: deal.productImage || "",
          displayPayout: user.role === 'USER' ? undefined : displayPayout,
          // Always include juhiCommission to enable mediator auto-filling in the order form
          juhiCommission: deal.juhiCommission === undefined || deal.juhiCommission === null ? "N/A" : deal.juhiCommission
        };
      });

    return NextResponse.json({ success: true, data: sanitizedDeals });
  } catch (error) {
    console.error("Fetch Deals Error:", error);
    return NextResponse.json({ success: false, message: 'Failed to fetch active deals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      brandName, 
      productDetails, 
      productLink, 
      marketplace, 
      reviewSlots,
      ratingSlots,
      onlyOrderSlots,
      submittedSlots,
      dealType, 
      reviewType, 
      assignedMediators, 
      juhiCommission,
      productImage,
      userRemarks,
      mediatorRemarks,
      remarks 
    } = body;

    // Calculate Totals
    const rSlots = parseInt(reviewSlots) || 0;
    const rtSlots = parseInt(ratingSlots) || 0;
    const oSlots = parseInt(onlyOrderSlots) || 0;
    const subSlots = parseInt(submittedSlots) || 0;
    const totalSlots = rSlots + rtSlots + oSlots + subSlots;

    if (!brandName || !productDetails) {
      return NextResponse.json({ success: false, message: 'Brand and Product Details are required' }, { status: 400 });
    }

    await connectToDatabase();
    console.log("Creating deal with media:", productImage);

    // 1. Check if Brand exists
    const brand = await Brand.findOne({ name: brandName });
    if (!brand) return NextResponse.json({ success: false, message: 'Target Brand not found' }, { status: 404 });

    // 2. Auto-generate Unique Product Code
    const brandPrefix = brandName.substring(0, 3).toUpperCase().replace(/\s+/g, '');
    const detailPrefix = productDetails.substring(0, 4).toUpperCase().replace(/\s+/g, '');
    
    let generatedCode = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      generatedCode = `${brandPrefix}-${detailPrefix}-${randomPart}`;
      
      const existingInBrand = brand.productCodes.some(pc => pc.code === generatedCode);
      const existingInDeals = await ActiveDeal.findOne({ productCode: generatedCode });
      
      if (!existingInBrand && !existingInDeals) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) return NextResponse.json({ success: false, message: 'Failed to generate unique product code. Please try again.' }, { status: 500 });

    const parsedJuhi = parsePayoutValue(juhiCommission);
    const parsedCommission = parsePayoutValue(body.commission);
    const parsedOriginal = parsePayoutValue(body.originalCommission);

    const parsedAssignedMediators = Array.isArray(assignedMediators)
      ? assignedMediators.map((m: any) => ({
          mediatorId: m.mediatorId,
          commission: parsePayoutValue(m.commission)
        }))
      : [];

    // 3. Create the Active Deal
    const deal = await ActiveDeal.create({
      brandName,
      productDetails,
      productCode: generatedCode,
      productLink,
      marketplace,
      totalSlots,
      remainingSlots: totalSlots,
      reviewSlots: rSlots,
      remainingReview: rSlots,
      ratingSlots: rtSlots,
      remainingRating: rtSlots,
      onlyOrderSlots: oSlots,
      remainingOnly: oSlots,
      submittedSlots: subSlots,
      remainingSubmitted: subSlots,
      dealType,
      reviewType,
      assignedMediators: parsedAssignedMediators,
      juhiCommission: parsedJuhi,
      commission: parsedCommission,
      originalCommission: parsedOriginal,
      productImage,
      userRemarks,
      mediatorRemarks,
      remarks,
      isActive: true
    });

    // 4. Update Brand Inventory automatically
    brand.productCodes.push({
      code: generatedCode,
      stock: totalSlots,
      stockReview: rSlots,
      stockRating: rtSlots,
      stockOnly: oSlots,
      stockSubmitted: subSlots
    } as any);
    await brand.save();

    // Cache Invalidation (Blocking/Awaited)
    await invalidateDealsCache();

    // Trigger real-time Pusher event (fail-safe)
    try {
      const { triggerRealtimeEvent } = await import("@/lib/pusher");
      await triggerRealtimeEvent("public-deals", "deal-created", deal);
    } catch (err) {
      console.warn("Pusher active deal create trigger bypassed gracefully:", err);
    }

    // Dispatch FCM Broadcast Advertisement push notification (Fire-and-forget to prevent blocking UI)
    try {
      import("@/utils/fcm").then(({ sendBroadcastPushNotification }) => {
        sendBroadcastPushNotification({
          title: `🔥 New Deal: ${brandName}`,
          body: `A new deal has been launched for ${productDetails}. Claim your cashback now!`,
          data: {
            click_action: "/app/activedeals",
            brandName: brandName,
          }
        }).catch(fcmErr => console.warn("FCM background error:", fcmErr));
      });
    } catch (fcmErr) {
      console.warn("FCM import error:", fcmErr);
    }

    return NextResponse.json({ success: true, data: deal });
  } catch (error: any) {
    console.error("Deal Creation Error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error"}, { status: 500 });
  }
}
