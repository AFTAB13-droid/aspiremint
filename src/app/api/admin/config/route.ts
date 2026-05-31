import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { SystemConfig } from '@/modules/config/config.model';

const DEFAULT_ORDER_FIELDS = {
  brandName: { enabled: true, required: true, label: "Brand Name", type: "text", placeholder: "Choose Brand..." },
  productCode: { enabled: true, required: true, label: "Product Code", type: "text", placeholder: "Select Code..." },
  userOrderId: { enabled: true, required: true, label: "Merchant Order ID", type: "text", placeholder: "E.g. #ORD-9921" },
  reviewName: { enabled: true, required: true, label: "Review Name", type: "text", placeholder: "Profile used for review" },
  amount: { enabled: true, required: true, label: "Order Amount", type: "number", placeholder: "0.00" },
  dealType: { enabled: true, required: false, label: "Deal Type Selector", type: "radio", placeholder: "" },
  lessAmount: { enabled: true, required: false, label: "Less Amount (Order)", type: "number", placeholder: "0" },
  mediator: { enabled: true, required: true, label: "Mediator", type: "select", placeholder: "Select Authorized Mediator..." },
  screenshot: { enabled: true, required: true, label: "Order Artifact (Screenshot)", type: "file", placeholder: "Upload Screenshot Artifact" },
  aspireMintId: { enabled: true, required: true, label: "Your AspireMint ID", type: "text", placeholder: "" },
  buyerEmail: { enabled: true, required: true, label: "Primary Contact", type: "email", placeholder: "" }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || 'order_form_settings';
    
    await connectToDatabase();
    let config = await SystemConfig.findOne({ key });
    
    if (key === 'order_form_settings') {
      if (!config) {
        config = await SystemConfig.create({ key, value: DEFAULT_ORDER_FIELDS });
      }
      
      const mergedValue = { ...DEFAULT_ORDER_FIELDS };
      Object.keys(config?.value || {}).forEach(k => {
        if (mergedValue[k as keyof typeof DEFAULT_ORDER_FIELDS]) {
          mergedValue[k as keyof typeof DEFAULT_ORDER_FIELDS] = {
            ...mergedValue[k as keyof typeof DEFAULT_ORDER_FIELDS],
            ...config?.value[k]
          };
        }
      });
      return NextResponse.json({ success: true, data: mergedValue });
    }

    if (key === 'global_admin_settings') {
      const defaultGlobal = { isAutoAssignEnabled: true };
      if (!config) {
        config = await SystemConfig.create({ key, value: defaultGlobal });
      }
      return NextResponse.json({ success: true, data: { ...defaultGlobal, ...(config?.value || {}) } });
    }

    return NextResponse.json({ success: false, message: 'Invalid config key' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const key = body.key || 'order_form_settings';
    const value = body.key ? body.value : body;

    await connectToDatabase();

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: config?.value });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update config' }, { status: 500 });
  }
}
