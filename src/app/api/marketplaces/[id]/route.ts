import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { Marketplace } from '@/modules/brand/marketplace.model';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    await Marketplace.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true, message: 'Marketplace removed' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete marketplace' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();
    const updated = await Marketplace.findByIdAndUpdate(params.id, body, { new: true });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update marketplace' }, { status: 500 });
  }
}
