import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Marketplace } from '@/modules/brand/marketplace.model';

const DEFAULT_MARKETPLACES = ["Flipkart", "Amazon", "Meesho", "Snapdeal", "Myntra", "Shopsy", "Nykaa", "Blinkit", "Other"];

export async function GET() {
  try {
    await connectToDatabase();
    let marketplaces = await Marketplace.find({}).sort({ name: 1 });
    
    // Seed default marketplaces if none exist
    if (marketplaces.length === 0) {
      await Marketplace.insertMany(DEFAULT_MARKETPLACES.map(name => ({ name })));
      marketplaces = await Marketplace.find({}).sort({ name: 1 });
    }
    
    return NextResponse.json({ success: true, data: marketplaces });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch marketplaces' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });

    await connectToDatabase();
    const marketplace = await Marketplace.create({ name });
    return NextResponse.json({ success: true, data: marketplace });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ success: false, message: 'Marketplace already exists' }, { status: 400 });
    return NextResponse.json({ success: false, message: 'Failed to create marketplace' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });

    await connectToDatabase();
    await Marketplace.findByIdAndDelete(id);
    
    return NextResponse.json({ success: true, message: 'Marketplace removed' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to remove marketplace' }, { status: 500 });
  }
}
