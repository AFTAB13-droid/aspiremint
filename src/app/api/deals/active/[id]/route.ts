import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ActiveDeal } from '@/modules/brand/deal.model';
import { Brand } from '@/modules/brand/brand.model';
import { invalidateDealsCache } from '@/lib/redis';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const { id } = params;
    await connectToDatabase();

    const isJuhi = user.name?.toLowerCase().includes("juhi");
    const isAdmin = user.role === 'ADMIN' || isJuhi;

    let deal = null;
    const mongoose = (await import('mongoose')).default;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deal = await ActiveDeal.findById(id).lean();
    }
    
    if (!deal) {
      deal = await ActiveDeal.findOne({ productCode: id }).lean();
    }

    if (!deal) {
      return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });
    }

    // Role-based visibility check
    if (!isAdmin && !(deal as any).isActive) {
      return NextResponse.json({ success: false, message: 'This deal is no longer active' }, { status: 404 });
    }

    if (user.role === 'MEDIATOR' && !isJuhi) {
      const isAssigned = (deal as any).assignedMediators?.some((m: any) => m.mediatorId?.toString() === user.id || m.isAll);
      if (!isAssigned) {
        return NextResponse.json({ success: false, message: 'Access denied for this deal' }, { status: 403 });
      }
    }

    let displayPayout = 0;
    if (user.role === 'MEDIATOR') {
      displayPayout = (deal as any).assignedMediators?.find((m: any) => m.mediatorId?.toString() === user.id)?.commission || (deal as any).commission || 0;
    } else {
      displayPayout = (deal as any).assignedMediators?.[0]?.commission || (deal as any).commission || 0;
    }
    if (isJuhi) {
      displayPayout = (deal as any).juhiCommission || 0;
    }

    const sanitizedDeal = {
      ...deal,
      commission: isAdmin ? (deal as any).commission : undefined,
      productImage: (deal as any).productImage || "",
      displayPayout: user.role === 'USER' ? undefined : displayPayout,
      juhiCommission: (deal as any).juhiCommission || 0
    };

    return NextResponse.json({ success: true, data: sanitizedDeal });
  } catch (error) {
    console.error('Fetch single deal error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch deal details' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    await connectToDatabase();

    const oldDeal = await ActiveDeal.findById(id);
    if (!oldDeal) return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });

    // Handle Granular Stock Updates
    let finalBody: any = { ...body };
    
    if (body.reviewSlots !== undefined || body.ratingSlots !== undefined || body.onlyOrderSlots !== undefined) {
      const newReviewSlots = body.reviewSlots !== undefined ? parseInt(body.reviewSlots) : oldDeal.reviewSlots;
      const newRatingSlots = body.ratingSlots !== undefined ? parseInt(body.ratingSlots) : oldDeal.ratingSlots;
      const newOnlyOrderSlots = body.onlyOrderSlots !== undefined ? parseInt(body.onlyOrderSlots) : oldDeal.onlyOrderSlots;
      const newSubmittedSlots = body.submittedSlots !== undefined ? parseInt(body.submittedSlots) : oldDeal.submittedSlots;

      const reviewDelta = newReviewSlots - oldDeal.reviewSlots;
      const ratingDelta = newRatingSlots - oldDeal.ratingSlots;
      const onlyOrderDelta = newOnlyOrderSlots - oldDeal.onlyOrderSlots;
      const submittedDelta = newSubmittedSlots - oldDeal.submittedSlots;

      finalBody.reviewSlots = newReviewSlots;
      finalBody.remainingReview = Math.max(0, oldDeal.remainingReview + reviewDelta);
      
      finalBody.ratingSlots = newRatingSlots;
      finalBody.remainingRating = Math.max(0, oldDeal.remainingRating + ratingDelta);
      
      finalBody.onlyOrderSlots = newOnlyOrderSlots;
      finalBody.remainingOnly = Math.max(0, oldDeal.remainingOnly + onlyOrderDelta);

      finalBody.submittedSlots = newSubmittedSlots;
      finalBody.remainingSubmitted = Math.max(0, oldDeal.remainingSubmitted + submittedDelta);

      // Re-calculate Totals
      finalBody.totalSlots = finalBody.reviewSlots + finalBody.ratingSlots + finalBody.onlyOrderSlots + finalBody.submittedSlots;
      finalBody.remainingSlots = finalBody.remainingReview + finalBody.remainingRating + finalBody.remainingOnly + finalBody.remainingSubmitted;
    } else {
      // If none of the granular ones are present, use the old values
      finalBody.totalSlots = oldDeal.totalSlots;
      finalBody.remainingSlots = oldDeal.remainingSlots;
    }

    // Reactivate the deal automatically if it was archived but stocks were added
    if (!oldDeal.isActive && finalBody.remainingSlots > 0) {
      finalBody.isActive = true;
    }

    // 1. Sync global commission to all assigned mediators if commission is being updated
    if (body.commission !== undefined && oldDeal.assignedMediators) {
      const currentMediators = JSON.parse(JSON.stringify(oldDeal.assignedMediators));
      finalBody.assignedMediators = currentMediators.map((m: any) => ({
        ...m,
        commission: body.commission
      }));
    }

    const updatedDeal = await ActiveDeal.findByIdAndUpdate(
      id,
      { $set: finalBody },
      { new: true, runValidators: true }
    );

    // If stock was updated, sync total and segments with Brand registry
    if (finalBody.totalSlots !== undefined) {
      await Brand.findOneAndUpdate(
        { name: oldDeal.brandName, "productCodes.code": oldDeal.productCode },
        { $set: { 
            "productCodes.$.stock": finalBody.remainingSlots,
            "productCodes.$.stockReview": finalBody.remainingReview,
            "productCodes.$.stockRating": finalBody.remainingRating,
            "productCodes.$.stockOnly": finalBody.remainingOnly,
            "productCodes.$.stockSubmitted": finalBody.remainingSubmitted
        } }
      );
    }
    
    await invalidateDealsCache(); // Blocking/Awaited

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (error: any) {
    console.error('Deal update error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update deal' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "delete"; // default to delete

    await connectToDatabase();
    const deal = await ActiveDeal.findById(params.id);
    if (!deal) return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });

    if (mode === "archive") {
      // 1. Mark deal as inactive, but preserve the remaining stocks
      await ActiveDeal.findByIdAndUpdate(params.id, {
        $set: {
          isActive: false
        }
      });

      // (We no longer zero out the brand registry so the remaining stock is preserved upon restore)
    } else {
      // FULL DELETE MODE
      // 1. Remove from Brand Inventory entirely
      if (deal.brandName && deal.productCode) {
        await Brand.findOneAndUpdate(
          { name: deal.brandName },
          { $pull: { productCodes: { code: deal.productCode } } }
        );
      }

      // 2. Delete the deal record
      await ActiveDeal.findByIdAndDelete(params.id);
    }
    
    await invalidateDealsCache(); // Blocking/Awaited

    return NextResponse.json({ 
      success: true, 
      message: mode === "archive" ? 'Deal archived and stocks zeroed' : 'Active deal fully removed' 
    });
  } catch (error: any) {
    console.error('Deal delete/archive error:', error);
    return NextResponse.json({ success: false, message: 'Failed to process request' }, { status: 500 });
  }
}
