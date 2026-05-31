import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Brand } from '@/modules/brand/brand.model';

export async function GET() {
  try {
    await connectToDatabase();
    const brands = await Brand.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: brands });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch brands' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, productCodes, exchangeProducts } = await req.json();
    if (!name) return NextResponse.json({ success: false, message: 'Brand name is required' }, { status: 400 });

    await connectToDatabase();
    const brand = await Brand.create({ 
      name, 
      productCodes: productCodes || [],
      exchangeProducts: exchangeProducts || []
    });
    return NextResponse.json({ success: true, data: brand });
  } catch (error: any) {
    if (error.code === 11000) return NextResponse.json({ success: false, message: 'Brand already exists' }, { status: 400 });
    return NextResponse.json({ success: false, message: 'Failed to create brand' }, { status: 500 });
  }
}
