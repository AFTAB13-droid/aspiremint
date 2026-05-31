import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  console.warn("WARNING: GMAIL_USER or GMAIL_PASS is not set in environment variables.");
}

export const sendOTPEmail = async (email: string, name: string, otp: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Outfit', sans-serif; }
        .wrapper { width: 100%; background-color: #f1f5f9; padding: 60px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 40px; overflow: hidden; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 80px 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: white; text-transform: uppercase; margin: 0; }
        .logo span { color: #3b82f6; }
        .header-title { font-size: 10px; font-weight: 900; color: #3b82f6; letter-spacing: 5px; text-transform: uppercase; margin-top: 10px; }
        .content { padding: 60px 50px; text-align: center; }
        .greeting { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 16px; }
        .otp-box { background: linear-gradient(to bottom, #f8fafc, #f1f5f9); border: 2px solid #e2e8f0; border-radius: 32px; padding: 40px 20px; margin: 40px 0; }
        .otp-code { font-size: 56px; font-weight: 900; color: #2563eb; letter-spacing: 15px; margin: 0; }
        .footer { padding: 50px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer-text { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1 class="logo">ASPIRE<span>MINT</span></h1>
            <div class="header-title">Authorization Required</div>
          </div>
          <div class="content">
            <h2 class="greeting">Secure Identity Verification</h2>
            <p style="color: #64748b; font-weight: 500;">Hello <b>${name}</b>, please input the following Master Key in the command portal.</p>
            <div class="otp-box">
              <h1 class="otp-code">${otp}</h1>
            </div>
            <p style="font-size: 11px; font-weight: 800; color: #e11d48; text-transform: uppercase; letter-spacing: 1px;">⚠️ EXPIRING IN 10 MINUTES</p>
          </div>
          <div class="footer">
            <p class="footer-text">© 2026 ASPIREMINT CO. • QUANTUM SECURE INFRASTRUCTURE</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return transporter.sendMail({
    from: `"AspireMint Security" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] Security OTP: ${otp}`,
    html: html,
  });
};

// Generic Base Template for all order emails
const getBaseTemplate = (title: string, subtitle: string, greeting: string, content: string, footerNote?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Outfit', sans-serif; }
    .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 30px 60px -10px rgba(0,0,0,0.1); border: 1px solid #f1f5f9; }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 60px 40px; text-align: center; }
    .logo { color: #3b82f6; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; margin: 0; }
    .logo span { color: white; }
    .header-title { font-size: 10px; font-weight: 900; color: #3b82f6; letter-spacing: 5px; text-transform: uppercase; margin-top: 15px; }
    .content { padding: 50px 40px; }
    .greeting { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 20px; }
    .body-text { font-size: 15px; color: #64748b; line-height: 1.6; font-weight: 500; }
    .info-grid { background: #f8fafc; border-radius: 24px; padding: 30px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .info-item { margin-bottom: 15px; display: block; }
    .info-label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; display: block; }
    .info-value { font-size: 14px; font-weight: 700; color: #1e293b; display: block; }
    .footer { padding: 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #f1f5f9; }
    .footer-text { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 100px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .status-success { background: #ecfdf5; color: #059669; }
    .status-error { background: #fef2f2; color: #dc2626; }
    .status-info { background: #eff6ff; color: #2563eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="logo">ASPIRE<span>MINT</span></h1>
        <div class="header-title">${title}</div>
      </div>
      <div class="content">
        <div class="greeting">${greeting}</div>
        <div class="body-text">${content}</div>
      </div>
      <div class="footer">
        <p class="footer-text">© 2026 ASPIREMINT INFRASTRUCTURE • ${footerNote || 'QUANTUM SECURE'}</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const sendOrderStatusEmail = async (email: string, name: string, orderId: string, status: string, amount: number, note?: string) => {
  const isApproved = status === "APPROVED" || status === "REFUND_APPROVED";

  let html: string;

  if (isApproved) {
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Approved</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulseSuccess { 0%{transform:scale(1);box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 70%{transform:scale(1.1);box-shadow:0 0 0 18px rgba(16,185,129,0)} 100%{transform:scale(1);box-shadow:0 0 0 0 rgba(16,185,129,0)} }
    @keyframes cardGlow { 0%{border-color:rgba(16,185,129,0.3)} 50%{border-color:rgba(6,182,212,0.5)} 100%{border-color:rgba(16,185,129,0.3)} }
    body{font-family:'Outfit',-apple-system,sans-serif;background:#0b0f19;color:#f1f5f9;margin:0;padding:0}
    .wrapper{width:100%;background:#0b0f19;padding:60px 0}
    .container{max-width:580px;margin:0 auto;background:#111827;border-radius:36px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:0 25px 60px -12px rgba(0,0,0,0.6);animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) both}
    .header{background:linear-gradient(135deg,#064e3b,#10b981,#06b6d4,#4f46e5);background-size:300% 300%;animation:gradientShift 10s ease infinite;padding:55px 40px;text-align:center;color:#fff}
    .header h1{margin:0;font-size:26px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase}
    .header p{margin:8px 0 0 0;font-size:13px;font-weight:600;opacity:0.9;letter-spacing:0.1em;text-transform:uppercase}
    .content{padding:50px 35px;text-align:center}
    .success-badge{display:inline-flex;align-items:center;justify-content:center;height:80px;width:80px;background:radial-gradient(circle,rgba(16,185,129,0.2),rgba(16,185,129,0.04));border-radius:50%;border:2.5px solid #10b981;margin-bottom:28px;animation:pulseSuccess 2s infinite ease-in-out}
    .success-symbol{font-size:36px;color:#10b981;font-weight:bold;line-height:1}
    .headline{font-size:26px;font-weight:900;color:#fff;margin:0 0 8px 0;letter-spacing:-0.02em}
    .subheadline{font-size:12px;color:#34d399;font-weight:800;margin:0 0 35px 0;text-transform:uppercase;letter-spacing:0.12em}
    .amount-hero{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.06));border:1.5px solid rgba(16,185,129,0.25);border-radius:28px;padding:28px 20px;margin-bottom:28px;animation:cardGlow 4s infinite ease-in-out}
    .amount-label{font-size:10px;font-weight:900;color:#34d399;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px}
    .amount-value{font-size:42px;font-weight:900;color:#10b981;font-family:monospace}
    .detail-card{background:rgba(255,255,255,0.02);border:1.5px solid rgba(16,185,129,0.15);border-radius:24px;padding:25px;margin:0 0 25px 0;text-align:left}
    .detail-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px dashed rgba(255,255,255,0.06);font-size:13px}
    .detail-row:last-child{border-bottom:none;padding-bottom:0}
    .card-label{color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:0.05em}
    .card-value{color:#f1f5f9;font-weight:800;text-align:right}
    .approved-notice{background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.03));border:1px solid rgba(16,185,129,0.2);border-radius:18px;padding:18px 20px;font-size:12px;color:#6ee7b7;font-weight:600;text-align:left;display:flex;align-items:center;gap:12px;line-height:1.5}
    .notice-icon{font-size:20px;flex-shrink:0}
    .footer{background:#0f172a;padding:35px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;color:#64748b;font-weight:600}
  </style>
</head>
<body>
  <div class="wrapper"><div class="container">
    <div class="header">
      <h1>Refund Approved ✓</h1>
      <p>Order ID: ${orderId}</p>
    </div>
    <div class="content">
      <div class="success-badge"><span class="success-symbol">✓</span></div>
      <h2 class="headline">Refund Authorized!</h2>
      <p class="subheadline">Your claim has been approved</p>
      <div class="amount-hero">
        <div class="amount-label">Approved Refund Amount</div>
        <div class="amount-value">₹${amount.toLocaleString()}</div>
      </div>
      <div class="detail-card">
        <div class="detail-row">
          <span class="card-label">Recipient</span>
          <span class="card-value">${name}</span>
        </div>
        <div class="detail-row">
          <span class="card-label">Order Reference</span>
          <span class="card-value">${orderId}</span>
        </div>
      </div>
      <div class="approved-notice">
        <span class="notice-icon">🎉</span>
        <span>Your refund has been verified and authorized by our specialist desk. The amount will be credited to your registered payout account within 24–48 hours.</span>
      </div>
    </div>
    <div class="footer"><p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p></div>
  </div></div>
</body>
</html>`;
  } else {
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Rejected</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes warnRipple { 0%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 70%{transform:scale(1.08);box-shadow:0 0 0 15px rgba(239,68,68,0)} 100%{transform:scale(1);box-shadow:0 0 0 0 rgba(239,68,68,0)} }
    body{font-family:'Outfit',-apple-system,sans-serif;background:#0b0f19;color:#cbd5e1;margin:0;padding:0}
    .wrapper{width:100%;background:#0b0f19;padding:60px 0}
    .container{max-width:580px;margin:0 auto;background:#111827;border-radius:36px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);animation:fadeInUp 1s cubic-bezier(0.16,1,0.3,1) both}
    .header{background:linear-gradient(135deg,#1e293b,#7f1d1d,#ef4444);background-size:300% 300%;animation:gradientShift 10s ease infinite;padding:50px 40px;text-align:center;color:#fff;border-bottom:4px solid #ef4444}
    .header h1{margin:0;font-size:24px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;color:#f87171}
    .header p{margin:8px 0 0 0;font-size:13px;font-weight:600;opacity:0.9;letter-spacing:0.1em;text-transform:uppercase}
    .content{padding:45px 35px;text-align:center}
    .status-badge{display:inline-flex;align-items:center;justify-content:center;height:70px;width:70px;background:rgba(239,68,68,0.1);border-radius:50%;border:2.5px solid #ef4444;margin-bottom:25px;animation:warnRipple 2s infinite ease-in-out}
    .status-symbol{font-size:32px;color:#ef4444;font-weight:bold}
    .headline{font-size:24px;font-weight:900;color:#fff;margin:0 0 8px 0;letter-spacing:-0.02em}
    .subheadline{font-size:12px;color:#94a3b8;font-weight:800;margin:0 0 35px 0;text-transform:uppercase;letter-spacing:0.1em}
    .reject-box{background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.15);border-radius:18px;padding:20px;margin:25px 0;text-align:left}
    .reject-title{font-size:10px;font-weight:900;color:#f87171;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px}
    .reject-text{color:#e2e8f0;font-weight:600;font-size:13px;line-height:1.5}
    .detail-card{background:rgba(255,255,255,0.02);border:1.5px solid rgba(239,68,68,0.2);border-radius:24px;padding:25px;margin:0 0 25px 0;text-align:left}
    .detail-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px dashed rgba(255,255,255,0.06);font-size:13px}
    .detail-row:last-child{border-bottom:none;padding-bottom:0}
    .card-label{color:#64748b;font-weight:800;text-transform:uppercase;letter-spacing:0.05em}
    .card-value{color:#f1f5f9;font-weight:800;text-align:right}
    .notice{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:15px 20px;font-size:12px;color:#94a3b8;font-weight:600;text-align:left;display:flex;align-items:center;gap:12px}
    .footer{background:#0f172a;padding:35px 30px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);font-size:11px;color:#64748b;font-weight:600}
  </style>
</head>
<body>
  <div class="wrapper"><div class="container">
    <div class="header">
      <h1>Refund Rejected</h1>
      <p>Order ID: ${orderId}</p>
    </div>
    <div class="content">
      <div class="status-badge"><span class="status-symbol">!</span></div>
      <h2 class="headline">Submission Rejected</h2>
      <p class="subheadline">Clearance declined</p>
      ${note ? `<div class="reject-box"><div class="reject-title">Decline Reason</div><div class="reject-text">${note}</div></div>` : ''}
      <div class="detail-card">
        <div class="detail-row">
          <span class="card-label">Recipient</span>
          <span class="card-value">${name}</span>
        </div>
        <div class="detail-row">
          <span class="card-label">Order Reference</span>
          <span class="card-value">${orderId}</span>
        </div>
        <div class="detail-row">
          <span class="card-label">Amount on Claim</span>
          <span class="card-value" style="color:#f87171">₹${amount.toLocaleString()}</span>
        </div>
      </div>
      <div class="notice">
        <span style="font-size:18px">🛡️</span>
        <span>If you believe this decision is in error, you can raise an appeal or re-submit clean evidence in the support command center.</span>
      </div>
    </div>
    <div class="footer"><p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p></div>
  </div></div>
</body>
</html>`;
  }

  return transporter.sendMail({
    from: `"AspireMint Portal" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: isApproved
      ? `[AspireMint] ✓ Refund Approved: Order ${orderId}`
      : `[AspireMint] Refund Rejected: Order ${orderId}`,
    html,
  });
};

export const sendOrderCreationEmail = async (email: string, name: string, orderData: any) => {
  const content = `
    Your order synchronization request has been initialized successfully.
    <div class="info-grid">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <span class="info-item">
          <span class="info-label">Reference ID</span>
          <span class="info-value">${orderData.aspireOrderId}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Brand</span>
          <span class="info-value">${orderData.brandName}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Amount</span>
          <span class="info-value">₹${orderData.amount.toLocaleString()}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Deal Type</span>
          <span class="info-value">${orderData.dealType}</span>
        </span>
      </div>
    </div>
    Our verification team is now auditing your deployment. You will be notified once the status changes.
  `;

  const html = getBaseTemplate(
    "INITIALIZATION SUCCESS",
    "Order Created",
    `Welcome, ${name}`,
    content,
    "AWAITING VERIFICATION"
  );

  return transporter.sendMail({
    from: `"AspireMint Portal" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] New Order Initialized: ${orderData.aspireOrderId}`,
    html,
  });
};

export const sendOrderPaymentEmail = async (email: string, name: string, orderId: string, paymentData: any) => {
  const content = `
    Excellent! Your order deployment <b>${orderId}</b> has been finalized with successful payment.
    <div class="info-grid" style="border-color: #3b82f6; background: #eff6ff;">
      <span class="info-item">
        <span class="info-label" style="color: #3b82f6;">Transaction Status</span>
        <span class="status-badge status-info">COMPLETED & PAID</span>
      </span>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <span class="info-item">
          <span class="info-label">Transaction ID</span>
          <span class="info-value">${paymentData.transactionId || 'SYSTEM_GEN'}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Final Amount</span>
          <span class="info-value">₹${paymentData.amount.toLocaleString()}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Paid At</span>
          <span class="info-value">${new Date(paymentData.paidAt).toLocaleString()}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Authorized By</span>
          <span class="info-value">${paymentData.paidByName}</span>
        </span>
      </div>
    </div>
    Thank you for choosing AspireMint for your deal management.
  `;

  const html = getBaseTemplate(
    "PAYMENT FINALIZED",
    "Order Completed",
    `Success, ${name}!`,
    content,
    "TRANSACTION ARCHIVED"
  );

  return transporter.sendMail({
    from: `"AspireMint Finance" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] Payment Receipt: Order ${orderId}`,
    html,
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const content = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="font-size: 32px; font-weight: 900; color: #1e1b4b; margin-bottom: 24px;">Welcome to the Elite.</h2>
      <p style="font-size: 16px; color: #64748b; line-height: 1.8; font-weight: 500; margin-bottom: 40px;">
        Your identity has been successfully verified across our secure operational layer. You now have full access to the AspireMint deal management ecosystem.
      </p>
      
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 32px; padding: 40px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
        <div style="display: block; text-align: left;">
          <div style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Access Level</span>
            <span style="font-size: 14px; font-weight: 800; color: #1e293b; display: block;">Premium Authorized</span>
          </div>
          <div style="padding: 10px 0;">
            <span style="font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 4px;">Network ID</span>
            <span style="font-size: 14px; font-weight: 800; color: #3b82f6; display: block;">VERIFIED_NODE</span>
          </div>
        </div>
      </div>

      <div style="margin-top: 40px;">
        <a href="https://aspiremint.com/dashboard" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 20px 40px; border-radius: 100px; text-decoration: none; font-weight: 900; font-size: 12px; text-transform: uppercase; letter-spacing: 3px;">Initialize Dashboard</a>
      </div>
    </div>
  `;

  const html = getBaseTemplate(
    "ONBOARDING COMPLETE",
    "Welcome to AspireMint",
    `Greetings ${name},`,
    content,
    "OPERATIONAL READINESS: 100%"
  );

  return transporter.sendMail({
    from: `"AspireMint Onboarding" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] Welcome to the Specialist Command, ${name}`,
    html,
  });
};
