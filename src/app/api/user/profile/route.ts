import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import connectToDatabase from '@/lib/db';
import redis from '@/lib/redis';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await User.findOne({ email: session.user.email }).select('-password');
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile API GET Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, mobile, upiId, bankName, accountHolder, accountNumber, ifscCode, branchName, bankDetails, otp } = body;

    const hasPaymentChanges = upiId !== undefined || 
                             bankName !== undefined || 
                             accountHolder !== undefined || 
                             accountNumber !== undefined || 
                             ifscCode !== undefined || 
                             branchName !== undefined || 
                             bankDetails !== undefined;

    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (hasPaymentChanges) {
      const isInitialSetup = !dbUser.isProfileComplete || (!dbUser.paymentDetails?.upiId && !dbUser.paymentDetails?.accountNumber);

      if (!isInitialSetup) {
        if (!otp) {
          return NextResponse.json({ success: false, message: 'OTP verification required for payment updates' }, { status: 400 });
        }

        const normalizedEmail = session.user.email.trim().toLowerCase();
        const storedOtp = await redis.get(`payment_update_otp:${normalizedEmail}`);
        if (!storedOtp || String(storedOtp) !== String(otp).trim()) {
          return NextResponse.json({ success: false, message: 'Invalid or expired security code' }, { status: 400 });
        }
        
        // Delete OTP after successful verification
        await redis.del(`payment_update_otp:${normalizedEmail}`);
      }
    }
    
    // Build update object dynamically
    const updatePayload: any = {};
    if (name) updatePayload.name = name;
    if (mobile) updatePayload.mobile = mobile;
    
    // Payment Details patching
    if (upiId !== undefined) updatePayload['paymentDetails.upiId'] = upiId;
    if (bankName !== undefined) updatePayload['paymentDetails.bankName'] = bankName;
    if (accountHolder !== undefined) updatePayload['paymentDetails.accountHolder'] = accountHolder;
    if (accountNumber !== undefined) updatePayload['paymentDetails.accountNumber'] = accountNumber;
    if (ifscCode !== undefined) updatePayload['paymentDetails.ifscCode'] = ifscCode;
    if (branchName !== undefined) updatePayload['paymentDetails.branchName'] = branchName;
    if (bankDetails !== undefined) updatePayload['paymentDetails.bankDetails'] = bankDetails;
    
    updatePayload.isProfileComplete = true;

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updatePayload },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // SYNC: Update all active orders with latest payment details
    try {
      const { Order } = await import('@/modules/order/order.model');
      
      const orderSyncPayload: any = {};
      if (upiId !== undefined) orderSyncPayload['refundDetails.upiId'] = upiId;
      if (bankName !== undefined) orderSyncPayload['refundDetails.bankName'] = bankName;
      if (accountHolder !== undefined) orderSyncPayload['refundDetails.accountHolderName'] = accountHolder;
      if (accountNumber !== undefined) orderSyncPayload['refundDetails.accountNumber'] = accountNumber;
      if (ifscCode !== undefined) orderSyncPayload['refundDetails.ifscCode'] = ifscCode;

      if (Object.keys(orderSyncPayload).length > 0) {
        await Order.updateMany(
            { 
              buyer: user._id, 
              status: { $nin: ["COMPLETED", "REFUNDED", "CANCELLED"] } 
            },
            { $set: orderSyncPayload }
        );
      }
    } catch (syncError) {
      console.error('Payment Detail Sync Error:', syncError);
      // We don't fail the whole profile update if sync fails, but log it
    }

    // Notify user about security credential changes
    try {
      const { NotificationService } = await import("@/services/notification.service");
      const { NotificationType } = await import("@/modules/notification/notification.model");
      
      const changeMsg = hasPaymentChanges 
        ? "Your primary payment details (UPI ID/Bank Details) have been updated successfully."
        : "Your profile information was updated successfully.";

      await NotificationService.create({
        recipient: user._id.toString(),
        type: NotificationType.SYSTEM,
        title: hasPaymentChanges ? "Security Update: Payment Details Changed" : "Security Update: Profile Updated",
        message: `${changeMsg} If this wasn't you, contact support immediately.`,
        actionUrl: "/app/settings",
      });
    } catch (notifErr) {
      console.error("Failed to generate profile update notification:", notifErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated completely' 
    });
  } catch (error) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
