import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { User } from '@/modules/user/user.model';
import { Order } from '@/modules/order/order.model';
import connectToDatabase from '@/lib/db';
import { transporter, renderSimpleEmail, renderTable } from '@/services/emailService'; // We'll export transporter

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUBADMIN") {
      return NextResponse.json({ success: false, message: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body; // 'email' or 'download'

    await connectToDatabase();
    
    const mediator = await User.findById(params.id).lean();
    if (!mediator || mediator.role !== 'MEDIATOR') {
      return NextResponse.json({ success: false, message: 'Mediator not found' }, { status: 404 });
    }

    const deals = await Order.find({ mediator: mediator._id }).lean();
    const totalDeals = deals.length;
    const completedDeals = deals.filter(d => d.status === 'COMPLETED').length;
    const successRate = totalDeals > 0 ? ((completedDeals / totalDeals) * 100).toFixed(1) : "0.0";
    
    // Generate beautiful HTML for the report
    const htmlReport = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mediator Summary Report - ${mediator.systemDisplayName || mediator.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
          .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; color: white; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
          .header p { margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; }
          .stats-grid { display: flex; flex-wrap: wrap; gap: 20px; padding: 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
          .stat-card { flex: 1; min-width: 120px; background: white; padding: 20px; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
          .stat-card h3 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
          .stat-card p { margin: 10px 0 0 0; font-size: 28px; font-weight: 900; color: #0f172a; }
          .details { padding: 30px; }
          .details h2 { font-size: 18px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th, td { text-align: left; padding: 12px 15px; border-bottom: 1px solid #e2e8f0; }
          th { background-color: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .status { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
          .status.completed { background: #dcfce7; color: #166534; }
          .status.pending { background: #fef9c3; color: #854d0e; }
          .status.cancelled { background: #fee2e2; color: #991b1b; }
          .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${mediator.systemDisplayName || mediator.name}</h1>
            <p>Official Mediator Portfolio & Performance Report</p>
            <p>ID: ${mediator.aspireMintId || 'N/A'} | Email: ${mediator.email}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Deals</h3>
              <p>${totalDeals}</p>
            </div>
            <div class="stat-card">
              <h3>Success Rate</h3>
              <p style="color: #059669;">${successRate}%</p>
            </div>
            <div class="stat-card">
              <h3>Status</h3>
              <p style="font-size: 18px; line-height: 35px; color: ${mediator.isCampaignPaused ? '#d97706' : '#059669'};">${mediator.isCampaignPaused ? 'PAUSED' : 'ACTIVE'}</p>
            </div>
          </div>

          <div class="details">
            <h2>Order History</h2>
            <div style="overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch;">
              <table style="min-width: 600px;">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Brand</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${deals.map(d => {
                    let statusClass = 'pending';
                    if (d.status === 'COMPLETED') statusClass = 'completed';
                    if (d.status === 'CANCELLED' || d.status === 'REFUND_REJECTED') statusClass = 'cancelled';
                    return `
                    <tr>
                      <td style="font-weight: 600;">${d.userOrderId}</td>
                      <td>${d.brandName}</td>
                      <td style="font-weight: bold;">₹${d.amount}</td>
                      <td><span class="status ${statusClass}">${d.status}</span></td>
                      <td>${new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                    `
                  }).join('')}
                  ${deals.length === 0 ? '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No records found</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} by AspireMint System
          </div>
        </div>
      </body>
      </html>
    `;

    if (action === 'download') {
      return new NextResponse(htmlReport, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        }
      });
    }

    if (action === 'email') {
      const { transporter } = await import('@/services/emailService');
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"AspireMint Admin" <info@aspiremint.in>',
        to: mediator.email, // Send to the mediator
        subject: `[AspireMint] Your Performance Summary Report`,
        html: htmlReport,
      });

      // Optionally, send a copy to the admin who triggered it
      if (session.user.email) {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"AspireMint Admin" <info@aspiremint.in>',
          to: session.user.email,
          subject: `[AspireMint] Performance Summary Report for ${mediator.systemDisplayName || mediator.name}`,
          html: htmlReport,
        });
      }

      return NextResponse.json({ success: true, message: 'Report sent successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Mediator report error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
