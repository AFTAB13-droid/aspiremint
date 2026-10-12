import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ActiveDeal } from '@/modules/brand/deal.model';
import mongoose from 'mongoose';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Please log in to set deal reminders' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;
    await connectToDatabase();

    let deal = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deal = await ActiveDeal.findById(id);
    }
    if (!deal) {
      deal = await ActiveDeal.findOne({ productCode: id });
    }

    if (!deal) {
      return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });
    }

    const currentSubscribers = (deal.notifySubscribers || []).map((s: any) => s.toString());
    const isAlreadySubscribed = currentSubscribers.includes(userId);

    if (isAlreadySubscribed) {
      // Toggle off / Unsubscribe
      await ActiveDeal.findByIdAndUpdate(deal._id, {
        $pull: { notifySubscribers: new mongoose.Types.ObjectId(userId) },
      });
      return NextResponse.json({
        success: true,
        isSubscribed: false,
        message: 'Reminder cancelled for this deal.',
      });
    } else {
      // Subscribe
      await ActiveDeal.findByIdAndUpdate(deal._id, {
        $addToSet: { notifySubscribers: new mongoose.Types.ObjectId(userId) },
      });
      return NextResponse.json({
        success: true,
        isSubscribed: true,
        message: 'Notification set! We will alert you via push & in-app as soon as this deal is live again! 🔔',
      });
    }
  } catch (error: any) {
    console.error('Deal notify subscription error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update reminder' }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: true, isSubscribed: false });
    }

    const userId = (session.user as any).id;
    const { id } = params;
    await connectToDatabase();

    let deal = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      deal = await ActiveDeal.findById(id).select('notifySubscribers');
    }
    if (!deal) {
      deal = await ActiveDeal.findOne({ productCode: id }).select('notifySubscribers');
    }

    if (!deal) {
      return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });
    }

    const isSubscribed = Boolean(deal.notifySubscribers?.some((s: any) => s.toString() === userId));
    return NextResponse.json({ success: true, isSubscribed });
  } catch (error: any) {
    return NextResponse.json({ success: false, isSubscribed: false });
  }
}
