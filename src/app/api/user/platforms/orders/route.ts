import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import { ActiveDeal } from '@/modules/brand/deal.model';
import { Order } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateRandomNumeric(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function generatePlatformOrderId(platform: string, seed: number): string {
  const norm = platform.toLowerCase();
  if (norm.includes('amazon')) {
    const p1 = (402 + (seed % 7)).toString();
    const p2 = ((seed * 174921) % 9000000 + 1000000).toString();
    const p3 = ((seed * 849201) % 9000000 + 1000000).toString();
    return `${p1}-${p2}-${p3}`;
  }
  if (norm.includes('flipkart')) {
    const numPart = ((seed * 4920194821) % 9000000000000000 + 1000000000000000).toString();
    return `OD33${numPart.slice(0, 16)}`;
  }
  if (norm.includes('blinkit')) {
    const numPart = ((seed * 839201) % 90000000000 + 10000000000).toString();
    return `ORD${numPart.slice(0, 11)}`;
  }
  // Default fallback
  return `ORD-${seed}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userQuery = session.user.id
      ? { _id: session.user.id }
      : { email: session.user.email.toLowerCase().trim() };

    const user = await User.findOne(userQuery);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const marketplace = (searchParams.get('marketplace') || 'amazon').toLowerCase().trim();

    const platformKey = marketplace.includes('flipkart')
      ? 'flipkart'
      : marketplace.includes('blinkit')
      ? 'blinkit'
      : 'amazon';

    const platformConfig = user.linkedPlatforms?.[platformKey];
    const isConnected = Boolean(platformConfig?.connected);

    if (!isConnected || !platformConfig) {
      return NextResponse.json({
        success: true,
        connected: false,
        platform: platformKey,
        accountName: user.name,
        orders: [],
        message: `${platformKey.toUpperCase()} is not yet linked. Link your account with 1-click sandboxed bridge to fetch orders.`,
      });
    }

    const accountName = platformConfig.accountName || user.name;
    const accountIdentifier = platformConfig.accountIdentifier || '';
    const lastSyncedAt = platformConfig.lastSyncedAt || new Date();

    // Fetch existing user orders to detect what has already been submitted in AspireMint
    const existingOrders = await Order.find({ buyer: user._id }).select('userOrderId status brandName productCode');
    const registeredOrderIds = new Set(existingOrders.map(o => o.userOrderId?.trim().toLowerCase()));

    // Fetch matching active deals from database for this marketplace
    const deals = await ActiveDeal.find({
      isActive: true,
      marketplace: { $regex: new RegExp(platformKey, 'i') },
    }).limit(10).lean();

    // Generate sandboxed live orders list for this user session
    // We blend real deals from the database so the user can immediately 1-click populate valid product codes & brands!
    const ordersList: any[] = [];
    const baseSeed = (user._id.toString().charCodeAt(0) || 5) * 1337;

    const sampleImages = [
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
    ];

    if (deals.length > 0) {
      deals.forEach((deal: any, idx: number) => {
        const orderId = generatePlatformOrderId(platformKey, baseSeed + idx * 73 + 19);
        const isAlreadySubmitted = registeredOrderIds.has(orderId.toLowerCase());
        
        // Approximate realistic order amount from deal commission or reasonable defaults
        let dealAmount = 599;
        if (typeof deal.commission === 'number' && deal.commission > 0) {
          dealAmount = Math.max(349, deal.commission * 3);
        } else if (idx === 1) dealAmount = 899;
        else if (idx === 2) dealAmount = 1299;

        const dateOffset = idx * 2;
        const d = new Date();
        d.setDate(d.getDate() - dateOffset);
        const formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        ordersList.push({
          orderId,
          marketplace: deal.marketplace || platformKey.toUpperCase(),
          title: deal.productDetails || `${deal.brandName} Product #${deal.productCode}`,
          brandName: deal.brandName,
          productCode: deal.productCode,
          dealType: deal.dealType || 'Empty Box',
          reviewType: deal.reviewType || 'REVIEW',
          amount: dealAmount,
          lessAmount: typeof deal.juhiCommission === 'number' ? deal.juhiCommission : 0,
          orderDate: `${formattedDate}, 02:45 PM`,
          status: idx === 0 ? 'Delivered Today' : idx === 1 ? 'Delivered Yesterday' : 'Delivered on ' + formattedDate,
          imageUrl: deal.productImage || sampleImages[idx % sampleImages.length],
          productLink: deal.productLink || '',
          isAlreadySubmitted,
          reviewerName: accountName,
          platformDisplayName: platformKey === 'amazon' ? 'Amazon India' : platformKey === 'flipkart' ? 'Flipkart' : 'Blinkit Instant',
        });
      });
    } else {
      // Fallback sandbox orders if no specific active deal exists in DB for this marketplace
      const fallbackItems = platformKey === 'blinkit' ? [
        { brand: 'Amul', code: 'AMUL-MILK-01', title: 'Amul Taaza Homogenised Toned Milk 1L Pack of 2', amt: 148 },
        { brand: 'Fortune', code: 'FORT-OIL-500', title: 'Fortune Sunlite Refined Sunflower Oil 1L', amt: 175 },
        { brand: 'Surf Excel', code: 'SURF-DET-1KG', title: 'Surf Excel Quick Wash Detergent Powder 1 kg', amt: 215 },
      ] : platformKey === 'flipkart' ? [
        { brand: 'Boat', code: 'BOAT-AIR-141', title: 'boAt Airdopes 141 Bluetooth Truly Wireless Earbuds', amt: 1299 },
        { brand: 'Noise', code: 'NOISE-COLOR-2', title: 'Noise ColorFit Pulse 2 Max 1.85" Display Smartwatch', amt: 1499 },
        { brand: 'Fire-Boltt', code: 'FIRE-NINJA-01', title: 'Fire-Boltt Ninja Call Pro Plus 1.83" Smart Watch', amt: 1199 },
      ] : [
        { brand: 'Boat', code: 'BOAT-255-PRO', title: 'boAt Rockerz 255 Pro+ Bluetooth Neckband with Fast Charge', amt: 999 },
        { brand: 'Milton', code: 'MILTON-FLASK-1L', title: 'Milton Thermosteel Flip Lid Flask 1000ml Silver', amt: 849 },
        { brand: 'Portronics', code: 'PORT-TOAD-23', title: 'Portronics Toad 23 Wireless Optical Mouse 2.4GHz', amt: 299 },
      ];

      fallbackItems.forEach((item, idx) => {
        const orderId = generatePlatformOrderId(platformKey, baseSeed + (idx + 1) * 97);
        const isAlreadySubmitted = registeredOrderIds.has(orderId.toLowerCase());
        const d = new Date();
        d.setDate(d.getDate() - idx * 2);
        const formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

        ordersList.push({
          orderId,
          marketplace: platformKey.toUpperCase(),
          title: item.title,
          brandName: item.brand,
          productCode: item.code,
          dealType: 'Empty Box',
          reviewType: 'REVIEW',
          amount: item.amt,
          lessAmount: 0,
          orderDate: `${formattedDate}, 04:30 PM`,
          status: idx === 0 ? 'Delivered Yesterday' : 'Delivered on ' + formattedDate,
          imageUrl: sampleImages[idx % sampleImages.length],
          productLink: '',
          isAlreadySubmitted,
          reviewerName: accountName,
          platformDisplayName: platformKey === 'amazon' ? 'Amazon India' : platformKey === 'flipkart' ? 'Flipkart' : 'Blinkit Instant',
        });
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      platform: platformKey,
      accountName,
      accountIdentifier,
      lastSyncedAt,
      ordersCount: ordersList.length,
      orders: ordersList,
    });
  } catch (error: any) {
    console.error('Platforms Orders API Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
