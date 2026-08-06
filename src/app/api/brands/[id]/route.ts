import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Brand } from '@/modules/brand/brand.model';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    // Only update fields provided in the body
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.productCodes !== undefined) updateData.productCodes = body.productCodes;
    if (body.exchangeProducts !== undefined) updateData.exchangeProducts = body.exchangeProducts;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    console.log("Updating Brand ID:", params.id, "With data:", updateData);

    const brand = await Brand.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!brand) return NextResponse.json({ success: false, message: 'Brand not found' }, { status: 404 });

    // Synchronization logic: Update ActiveDeals if productCodes were changed
    if (updateData.productCodes) {
      const syncPromises = updateData.productCodes.map(async (pc: any) => {
        // We must fetch the existing ActiveDeal to calculate the delta!
        // We cannot just reset it, otherwise we lose historical consumed stock data.
        const { ActiveDeal } = await import('@/modules/brand/deal.model');
        const deal = await ActiveDeal.findOne({ productCode: pc.code });
        
        if (deal) {
          const reviewDelta = (pc.stockReview || 0) - (deal.remainingReview || 0);
          const ratingDelta = (pc.stockRating || 0) - (deal.remainingRating || 0);
          const onlyDelta = (pc.stockOnly || 0) - (deal.remainingOnly || 0);
          const subDelta = (pc.stockSubmitted || 0) - (deal.remainingSubmitted || 0);

          const newTotalReview = Math.max(0, (deal.reviewSlots || 0) + reviewDelta);
          const newTotalRating = Math.max(0, (deal.ratingSlots || 0) + ratingDelta);
          const newTotalOnly = Math.max(0, (deal.onlyOrderSlots || 0) + onlyDelta);
          const newTotalSub = Math.max(0, (deal.submittedSlots || 0) + subDelta);

          const totalSlots = newTotalReview + newTotalRating + newTotalOnly + newTotalSub;
          const remainingSlots = (pc.stockReview || 0) + (pc.stockRating || 0) + (pc.stockOnly || 0) + (pc.stockSubmitted || 0);

          return ActiveDeal.findByIdAndUpdate(deal._id, {
            $set: {
              reviewSlots: newTotalReview,
              remainingReview: pc.stockReview || 0,
              ratingSlots: newTotalRating,
              remainingRating: pc.stockRating || 0,
              onlyOrderSlots: newTotalOnly,
              remainingOnly: pc.stockOnly || 0,
              submittedSlots: newTotalSub,
              remainingSubmitted: pc.stockSubmitted || 0,
              totalSlots: totalSlots,
              remainingSlots: remainingSlots,
              isActive: (deal.isActive === false && remainingSlots > 0) ? true : deal.isActive
            }
          });
        }
      });
      
      await Promise.all(syncPromises);
      
      // Clear cache so that the Active Deals page reflects the new stock immediately
      const { invalidateDealsCache } = await import('@/lib/redis');
      await invalidateDealsCache();
    }

    if (brand) console.log("Update Successful:", brand.name, "ExchangeCount:", brand.exchangeProducts?.length);
    return NextResponse.json({ success: true, data: brand });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await Brand.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Brand removed' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete brand' }, { status: 500 });
  }
}
