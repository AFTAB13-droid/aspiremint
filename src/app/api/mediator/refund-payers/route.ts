import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { User } from '@/modules/user/user.model';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.user.id).select('refundPayers');
    
    return NextResponse.json({ 
      success: true, 
      data: user?.refundPayers || [] 
    });
  } catch (error) {
    console.error('GET Refund Payers Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { name, detail } = await req.json();
    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $push: { refundPayers: { name, detail } } },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Refund payer added successfully',
      data: user?.refundPayers
    });
  } catch (error) {
    console.error('POST Refund Payers Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const payerId = searchParams.get('id');

    if (!payerId) {
      return NextResponse.json({ success: false, message: 'Payer ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(
      session.user.id,
      { $pull: { refundPayers: { _id: payerId } } }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Refund payer removed successfully' 
    });
  } catch (error) {
    console.error('DELETE Refund Payers Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
