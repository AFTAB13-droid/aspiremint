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
      const { ActiveDeal } = await import('@/modules/brand/deal.model');
      
      const syncPromises = updateData.productCodes.map(async (pc: any) => {
        // Calculate total stock from granular fields
        const total = (pc.stockReview || 0) + (pc.stockRating || 0) + (pc.stockOnly || 0) + (pc.stockSubmitted || 0);
        
        return ActiveDeal.findOneAndUpdate(
          { productCode: pc.code },
          { 
            $set: {
              totalSlots: total,
              remainingSlots: total, // Reset to match new registry state
              reviewSlots: pc.stockReview || 0,
              remainingReview: pc.stockReview || 0,
              ratingSlots: pc.stockRating || 0,
              remainingRating: pc.stockRating || 0,
              onlyOrderSlots: pc.stockOnly || 0,
              remainingOnly: pc.stockOnly || 0,
              submittedSlots: pc.stockSubmitted || 0,
              remainingSubmitted: pc.stockSubmitted || 0
            }
          }
        );
      });
      
      await Promise.all(syncPromises);
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
