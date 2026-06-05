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

// Global visual style configurations matching the admin email previewer designs
export const sendOTPEmail = async (email: string, name: string, otp: string) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Identity Verification</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowDashed {
      0% { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
      50% { border-color: rgba(6, 182, 212, 0.8); box-shadow: 0 0 20px rgba(6, 182, 212, 0.3); }
      100% { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 10px rgba(99, 102, 241, 0.1); }
    }
    @keyframes codePulse {
      0% { letter-spacing: 0.2em; }
      50% { letter-spacing: 0.28em; color: #06b6d4; }
      100% { letter-spacing: 0.2em; }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #cbd5e1; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 500px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #4f46e5, #06b6d4, #7c3aed); 
      background-size: 300% 300%;
      animation: gradientShift 8s ease infinite;
      padding: 45px 30px; 
      text-align: center; 
      color: #ffffff; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 900; 
      letter-spacing: 0.05em; 
      text-transform: uppercase;
      text-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .content { 
      padding: 45px 35px; 
      text-align: center; 
      line-height: 1.6; 
    }
    .greeting { 
      font-size: 18px; 
      font-weight: 800; 
      color: #ffffff; 
      margin-bottom: 12px; 
      text-align: left; 
    }
    .intro {
      font-size: 14px;
      color: #94a3b8;
      text-align: left;
      margin: 0 0 30px 0;
    }
    .otp-banner { 
      background-color: rgba(255, 255, 255, 0.02); 
      border: 2px dashed rgba(99, 102, 241, 0.4); 
      border-radius: 24px; 
      padding: 30px; 
      margin: 30px 0; 
      display: inline-block; 
      width: 85%; 
      animation: glowDashed 4s infinite ease-in-out;
    }
    .otp-code { 
      font-size: 42px; 
      font-weight: 900; 
      color: #818cf8; 
      letter-spacing: 0.2em; 
      font-family: monospace; 
      margin: 0; 
      animation: codePulse 3s infinite ease-in-out;
    }
    .expires-info { 
      font-size: 10px; 
      font-weight: 900; 
      color: #06b6d4; 
      margin-top: 10px; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
    }
    .warn-text {
      text-align: left;
      font-size: 12px;
      color: #64748b;
      margin: 30px 0 0 0;
      line-height: 1.5;
    }
    .meta-box { 
      border-top: 1px solid rgba(255, 255, 255, 0.06); 
      padding-top: 20px; 
      margin-top: 30px; 
      text-align: left; 
      font-size: 11px; 
      color: #475569; 
    }
    .meta-title {
      font-weight: 800;
      color: #6366f1;
      text-transform: uppercase;
      font-size: 9px;
      display: block;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #475569; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Identity Verification</h1>
      </div>
      <div class="content">
        <div class="greeting">Hello ${name},</div>
        <p class="intro">Please use the following single-use credentials code to complete registration or login authentication. Protect this code immediately.</p>
        
        <div class="otp-banner">
          <div class="otp-code">${otp}</div>
          <div class="expires-info">VALID FOR 10 MINUTES</div>
        </div>

        <p class="warn-text">
          If you did not execute this authentication workflow, please log in immediately to confirm no unauthorized sessions exist.
        </p>

        <div class="meta-box">
          <span class="meta-title">REQUEST META INFO</span>
          <span>• Authorized Security Level: <strong>Premium Node Access</strong></span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE COMPLIANCE DESK.</p>
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

export const sendOrderStatusEmail = async (
  email: string,
  name: string,
  orderId: string,
  status: string,
  amount: number,
  note?: string
) => {
  const isApproved = status === "APPROVED" || status === "REFUND_APPROVED";

  // Dynamic lookup of order specifics in MongoDB
  let brandName = "Sponsor Brand";
  let productName = "Campaign Product";
  let productCode = "Code";

  try {
    const { Order } = await import("@/modules/order/order.model");
    const orderDoc = await Order.findOne({ aspireOrderId: orderId }).lean();
    if (orderDoc) {
      brandName = orderDoc.brandName || brandName;
      productName = orderDoc.reviewName || productName;
      productCode = orderDoc.productCode || productCode;
    }
  } catch (err) {
    console.warn("Could not load order details for status update email:", err);
  }

  let html: string;

  if (isApproved) {
    // Beautiful REFUND_APPROVED Template
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Approved</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseSuccess {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 18px rgba(16, 185, 129, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes cardGlow {
      0% { border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 0 10px rgba(16, 185, 129, 0.05); }
      50% { border-color: rgba(6, 182, 212, 0.5); box-shadow: 0 0 25px rgba(6, 182, 212, 0.1); }
      100% { border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 0 10px rgba(16, 185, 129, 0.05); }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #f1f5f9; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 580px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.6);
      animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #064e3b, #10b981, #06b6d4, #4f46e5); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 55px 40px; 
      text-align: center; 
      color: #ffffff;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; right: -100%; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
      animation: shimmer 3s infinite;
      background-size: 200% 100%;
    }
    .header h1 { 
      margin: 0; 
      font-size: 26px; 
      font-weight: 900; 
      letter-spacing: -0.02em; 
      text-transform: uppercase;
      text-shadow: 0 2px 12px rgba(0,0,0,0.2);
      position: relative;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 13px; 
      font-weight: 600;
      opacity: 0.9; 
      letter-spacing: 0.1em;
      text-transform: uppercase;
      position: relative;
    }
    .content { 
      padding: 50px 35px; 
      text-align: center;
    }
    .success-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 80px;
      width: 80px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.04) 100%);
      border-radius: 50%;
      border: 2.5px solid #10b981;
      margin-bottom: 28px;
      animation: pulseSuccess 2s infinite ease-in-out;
    }
    .success-symbol {
      font-size: 36px;
      color: #10b981;
      font-weight: bold;
      line-height: 1;
    }
    .headline {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subheadline {
      font-size: 12px;
      color: #34d399;
      font-weight: 800;
      margin: 0 0 35px 0;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .amount-hero {
      background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06));
      border: 1.5px solid rgba(16, 185, 129, 0.25);
      border-radius: 28px;
      padding: 28px 20px;
      margin-bottom: 28px;
      animation: cardGlow 4s infinite ease-in-out;
    }
    .amount-label {
      font-size: 10px;
      font-weight: 900;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }
    .amount-value {
      font-size: 42px;
      font-weight: 900;
      color: #10b981;
      font-family: monospace;
      letter-spacing: -0.02em;
    }
    .detail-card { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1.5px solid rgba(16, 185, 129, 0.15); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 0 0 25px 0; 
      text-align: left;
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 12px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .detail-row:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }
    .card-label { 
      color: #64748b; 
      font-weight: 800; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value { 
      color: #f1f5f9; 
      font-weight: 800; 
      text-align: right; 
    }
    .approved-notice {
      background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03));
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 18px;
      padding: 18px 20px;
      margin-top: 8px;
      font-size: 12px;
      color: #6ee7b7;
      font-weight: 600;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
      line-height: 1.5;
    }
    .notice-icon {
      font-size: 20px;
      flex-shrink: 0;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 35px 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Refund Approved ✓</h1>
        <p>Order ID: ${orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="success-badge">
          <span class="success-symbol">✓</span>
        </div>
        <h2 class="headline">Refund Authorized!</h2>
        <p class="subheadline">Your claim has been approved</p>

        <div class="amount-hero">
          <div class="amount-label">Approved Refund Amount</div>
          <div class="amount-value">₹${amount?.toLocaleString() || "0.00"}</div>
        </div>

        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Recipient</span>
            <span class="card-value">${name || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${productName || "N/A"} (${productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Approved By</span>
            <span class="card-value" style="color: #34d399;">Admin Desk</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Approval Time</span>
            <span class="card-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>

        <div class="approved-notice">
          <span class="notice-icon">🎉</span>
          <span>Your refund has been verified and authorized by our specialist desk. The amount will be credited to your registered payout account within 24–48 hours.</span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  } else {
    // Beautiful REFUND_REJECTED Template
    html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Submission Rejected</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes warnRipple {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #cbd5e1; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 580px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #1e293b, #7f1d1d, #ef4444); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 50px 40px; 
      text-align: center; 
      color: #ffffff; 
      border-bottom: 4px solid #ef4444;
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 900; 
      letter-spacing: -0.02em; 
      text-transform: uppercase;
      color: #f87171;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 13px; 
      font-weight: 600;
      opacity: 0.9; 
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .content { 
      padding: 45px 35px; 
      text-align: center;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 70px;
      width: 70px;
      background-color: rgba(239, 68, 68, 0.1);
      border-radius: 50%;
      border: 2.5px solid #ef4444;
      margin-bottom: 25px;
      animation: warnRipple 2s infinite ease-in-out;
    }
    .status-symbol {
      font-size: 32px;
      color: #ef4444;
      font-weight: bold;
    }
    .headline {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subheadline {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 800;
      margin: 0 0 35px 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .detail-card { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1.5px solid rgba(239, 68, 68, 0.2); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 25px 0; 
      text-align: left;
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 12px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .detail-row:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }
    .card-label { 
      color: #64748b; 
      font-weight: 800; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value { 
      color: #f1f5f9; 
      font-weight: 800; 
      text-align: right; 
    }
    .total-row { 
      padding-top: 15px; 
      border-top: 1px solid rgba(255, 255, 255, 0.1); 
    }
    .total-label { 
      font-size: 14px; 
      font-weight: 900; 
      color: #ffffff; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-value { 
      font-size: 20px; 
      font-weight: 900; 
      color: #f87171; 
      font-family: monospace;
    }
    .reject-box { 
      background: rgba(239, 68, 68, 0.05); 
      border: 1px solid rgba(239, 68, 68, 0.15); 
      border-radius: 18px; 
      padding: 20px; 
      margin: 25px 0; 
      text-align: left;
    }
    .reject-title {
      font-size: 10px;
      font-weight: 900;
      color: #f87171;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .reject-text {
      color: #e2e8f0;
      font-weight: 600;
      font-size: 13px;
      line-height: 1.5;
    }
    .mediator-notice {
      background-color: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 15px 20px;
      margin-top: 30px;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 600;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .notice-icon {
      font-size: 18px;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 35px 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Refund Rejected</h1>
        <p>Order ID: ${orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="status-badge">
          <span class="status-symbol">!</span>
        </div>
        <h2 class="headline">Submission Rejected</h2>
        <p class="subheadline">Clearance declined</p>

        <div class="reject-box">
          <div class="reject-title">Decline Reason</div>
          <div class="reject-text">${note || "Mismatched review screenshot. Uploaded image does not contain the specified Amazon profile identifier or order completion ID matching campaign details."}</div>
        </div>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Recipient</span>
            <span class="card-value">${name || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${productName || "N/A"} (${productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Declined By</span>
            <span class="card-value" style="color: #f87171;">System Specialist</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Decline Time</span>
            <span class="card-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div class="detail-row total-row">
            <span class="total-label">Expected Refund Amount</span>
            <span class="total-value">₹${amount?.toLocaleString() || "0.00"}</span>
          </div>
        </div>

        <div class="mediator-notice">
          <span class="notice-icon">🛡️</span>
          <span>If you believe this decision is in error, you can raise an appeal or re-submit clean evidence screenshots in the support command center page.</span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
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

export const sendOrderCreationEmail = async (email: string, name: string, orderData: any, productImage?: string) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Submission Logged</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes loaderRotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulseShadow {
      0% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
      50% { box-shadow: 0 0 25px rgba(236, 72, 153, 0.4); }
      100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #f1f5f9; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 580px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 50px 40px; 
      text-align: center; 
      color: #ffffff; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 24px; 
      font-weight: 900; 
      letter-spacing: -0.02em; 
      text-transform: uppercase;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 13px; 
      font-weight: 600;
      opacity: 0.9; 
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .content { 
      padding: 45px 35px; 
      text-align: center;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 70px;
      width: 70px;
      background-color: rgba(99, 102, 241, 0.1);
      border-radius: 50%;
      border: 2.5px solid #6366f1;
      margin-bottom: 25px;
    }
    .status-symbol {
      display: inline-block;
      width: 32px;
      height: 32px;
      border: 3.5px solid rgba(99, 102, 241, 0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: loaderRotate 1.2s linear infinite;
    }
    .headline {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subheadline {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 800;
      margin: 0 0 35px 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .img-box {
      width: 100%;
      height: 180px;
      border-radius: 24px;
      overflow: hidden;
      margin-bottom: 30px;
      border: 1.5px solid rgba(255, 255, 255, 0.08);
      position: relative;
      animation: pulseShadow 4s infinite ease-in-out;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .img-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1f2937, #111827);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #64748b;
      font-weight: bold;
      letter-spacing: 0.05em;
    }
    .detail-card { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1.5px solid rgba(99, 102, 241, 0.2); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 25px 0; 
      text-align: left;
    }
    .detail-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 12px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .detail-row:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }
    .card-label { 
      color: #64748b; 
      font-weight: 800; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-value { 
      color: #f1f5f9; 
      font-weight: 800; 
      text-align: right; 
    }
    .total-row { 
      padding-top: 15px; 
      border-top: 1px solid rgba(255, 255, 255, 0.1); 
    }
    .total-label { 
      font-size: 14px; 
      font-weight: 900; 
      color: #ffffff; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-value { 
      font-size: 20px; 
      font-weight: 900; 
      color: #a78bfa; 
      font-family: monospace;
    }
    .mediator-notice {
      background-color: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 16px;
      padding: 15px 20px;
      margin-top: 30px;
      font-size: 12px;
      color: #a5b4fc;
      font-weight: 600;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .notice-icon {
      font-size: 18px;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 35px 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Submission Received</h1>
        <p>Order ID: ${orderData.aspireOrderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="status-badge">
          <span class="status-symbol"></span>
        </div>
        <h2 class="headline">Order Form Submitted</h2>
        <p class="subheadline">Verification in progress</p>

        <div class="img-box">
          ${productImage ? `
            <img class="product-img" src="${productImage}" alt="${orderData.reviewName || "Product"}" />
          ` : `
            <div class="img-placeholder">IMAGE NOT PROVIDED</div>
          `}
        </div>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${orderData.brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${orderData.reviewName || "N/A"} (${orderData.productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Review Type</span>
            <span class="card-value" style="color: #ec4899;">${orderData.reviewType || "Standard Review"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Submission Time</span>
            <span class="card-value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div class="detail-row total-row">
            <span class="total-label">Expected Refund Amount</span>
            <span class="total-value">₹${(Number(orderData.amount) + Number(orderData.lessAmount || 0)).toLocaleString() || "0.00"}</span>
          </div>
        </div>

        <div class="mediator-notice">
          <span class="notice-icon">🛡️</span>
          <span>Your submission has been queued. Our mediator desk standard operating guidelines require 12-24 hours to verify screenshot metadata authenticity. No manual action is required.</span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: `"AspireMint Portal" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] New Order Initialized: ${orderData.aspireOrderId}`,
    html,
  });
};

export const sendOrderPaymentEmail = async (email: string, name: string, orderId: string, paymentData: any) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Refund Verified & Settled</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseSuccess {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      70% { transform: scale(1.1); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @keyframes cardGlow {
      0% { border-color: rgba(16, 185, 129, 0.2); }
      50% { border-color: rgba(99, 102, 241, 0.4); }
      100% { border-color: rgba(16, 185, 129, 0.2); }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #f1f5f9; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 580px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #10b981, #06b6d4, #4f46e5); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 50px 40px; 
      text-align: center; 
      color: #ffffff; 
    }
    .header h1 { 
      margin: 0; 
      font-size: 26px; 
      font-weight: 900; 
      letter-spacing: -0.02em; 
      text-transform: uppercase;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 13px; 
      font-weight: 600;
      opacity: 0.9; 
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .content { 
      padding: 45px 35px; 
      text-align: center;
    }
    .success-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 70px;
      width: 70px;
      background-color: rgba(16, 185, 129, 0.1);
      border-radius: 50%;
      border: 2.5px solid #10b981;
      margin-bottom: 25px;
      animation: pulseSuccess 2s infinite;
    }
    .success-symbol {
      font-size: 32px;
      color: #10b981;
      font-weight: bold;
    }
    .headline {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .subheadline {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 800;
      margin: 0 0 35px 0;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .invoice-card { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1.5px solid rgba(16, 185, 129, 0.2); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 25px 0; 
      text-align: left;
      animation: cardGlow 4s infinite ease-in-out;
    }
    .invoice-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 12px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .invoice-row:last-child { 
      border-bottom: none; 
      padding-bottom: 0; 
    }
    .invoice-label { 
      color: #64748b; 
      font-weight: 800; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .invoice-value { 
      color: #f1f5f9; 
      font-weight: 800; 
      text-align: right; 
    }
    .total-row { 
      padding-top: 15px; 
      border-top: 1px solid rgba(255, 255, 255, 0.1); 
    }
    .total-label { 
      font-size: 14px; 
      font-weight: 900; 
      color: #ffffff; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-value { 
      font-size: 20px; 
      font-weight: 900; 
      color: #10b981; 
      font-family: monospace;
    }
    .mediator-info {
      background-color: rgba(99, 102, 241, 0.08);
      border: 1px solid rgba(99, 102, 241, 0.15);
      border-radius: 16px;
      padding: 15px 20px;
      margin-top: 30px;
      font-size: 12px;
      color: #818cf8;
      font-weight: 600;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mediator-icon {
      font-size: 18px;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 35px 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Refund Settlement</h1>
        <p>Order ID: ${orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="success-badge">
          <span class="success-symbol">✓</span>
        </div>
        <h2 class="headline">Escrow Released</h2>
        <p class="subheadline">Verification clearance complete</p>
        
        <div class="invoice-card">
          <div class="invoice-row">
            <span class="invoice-label">Sponsor Brand</span>
            <span class="invoice-value">${paymentData.brandName || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Product Name</span>
            <span class="invoice-value">${paymentData.productName || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Transaction ID</span>
            <span class="invoice-value">${paymentData.transactionId || 'SYSTEM_GEN'}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Payer Account</span>
            <span class="invoice-value">${name || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Clearance Time</span>
            <span class="invoice-value">${new Date(paymentData.paidAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          <div class="invoice-row total-row">
            <span class="total-label">Refund Disbursed</span>
            <span class="total-value">₹${paymentData.amount?.toLocaleString() || "0.00"}</span>
          </div>
        </div>

        <div class="mediator-info">
          <span class="mediator-icon">🛡️</span>
          <span>Verified & authorized under standard operating guidelines by dispute specialist <strong>${paymentData.paidByName || "Finance Desk"}</strong>. Payout has cleared escrow for direct credit.</span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: `"AspireMint Finance" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] Payment Receipt: Order ${orderId}`,
    html,
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to AspireMint</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800;900&display=swap" rel="stylesheet">
  <style>
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes glowBorder {
      0% { border-color: #6366f1; box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
      50% { border-color: #ec4899; box-shadow: 0 0 20px rgba(236, 72, 153, 0.6); }
      100% { border-color: #6366f1; box-shadow: 0 0 10px rgba(99, 102, 241, 0.4); }
    }
    @keyframes checkPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); box-shadow: 0 0 12px rgba(16, 185, 129, 0.5); }
      100% { transform: scale(1); }
    }
    @keyframes ctaBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    body { 
      font-family: 'Outfit', -apple-system, sans-serif; 
      background-color: #0b0f19; 
      color: #f1f5f9; 
      margin: 0; 
      padding: 0; 
      -webkit-font-smoothing: antialiased; 
    }
    .wrapper { 
      width: 100%; 
      background-color: #0b0f19; 
      padding: 60px 0; 
    }
    .container { 
      max-width: 580px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(-45deg, #4f46e5, #9333ea, #ec4899, #06b6d4); 
      background-size: 400% 400%;
      animation: gradientShift 12s ease infinite;
      padding: 60px 40px; 
      text-align: center; 
      color: #ffffff; 
      position: relative;
    }
    .header h1 { 
      margin: 0; 
      font-size: 36px; 
      font-weight: 900; 
      letter-spacing: -0.03em; 
      text-transform: uppercase;
      text-shadow: 0 4px 10px rgba(0,0,0,0.25);
    }
    .header p { 
      margin: 12px 0 0 0; 
      font-size: 14px; 
      font-weight: 600;
      opacity: 0.95; 
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .content { 
      padding: 50px 40px; 
      line-height: 1.6; 
    }
    .greeting { 
      font-size: 24px; 
      font-weight: 900; 
      color: #ffffff; 
      margin-bottom: 8px; 
      letter-spacing: -0.02em;
    }
    .intro { 
      font-size: 15px; 
      color: #94a3b8; 
      margin-bottom: 35px; 
      font-weight: 500;
    }
    .badge-container {
      margin-bottom: 35px;
    }
    .badge { 
      display: inline-block; 
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8; 
      font-size: 11px; 
      font-weight: 900; 
      text-transform: uppercase; 
      letter-spacing: 0.2em; 
      padding: 8px 18px; 
      border-radius: 9999px; 
      border: 1px solid rgba(129, 140, 248, 0.3);
      animation: glowBorder 3s infinite;
    }
    .checklist { 
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 24px; 
      padding: 30px; 
      margin-bottom: 40px; 
    }
    .checklist h3 { 
      margin: 0 0 20px 0; 
      font-size: 12px; 
      font-weight: 900; 
      text-transform: uppercase; 
      color: #6366f1; 
      letter-spacing: 0.15em; 
    }
    .checklist-item { 
      display: flex; 
      align-items: center; 
      margin-bottom: 16px; 
      font-size: 14px; 
      color: #cbd5e1; 
      font-weight: 600;
    }
    .checklist-item:last-child { 
      margin-bottom: 0; 
    }
    .checklist-icon { 
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 22px;
      width: 22px;
      background: #10b981; 
      color: #ffffff;
      border-radius: 50%;
      margin-right: 15px; 
      font-size: 11px;
      font-weight: 900; 
      flex-shrink: 0;
      animation: checkPulse 2s infinite ease-in-out;
    }
    .cta-container { 
      text-align: center; 
      margin: 45px 0; 
    }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); 
      color: #ffffff !important; 
      font-weight: 900; 
      font-size: 13px; 
      text-decoration: none; 
      padding: 18px 40px; 
      border-radius: 16px; 
      text-transform: uppercase;
      letter-spacing: 0.15em;
      box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5); 
      animation: ctaBounce 3s infinite ease-in-out;
    }
    .footer { 
      background-color: #0f172a; 
      padding: 35px 30px; 
      text-align: center; 
      border-top: 1px solid rgba(255, 255, 255, 0.05); 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
    }
    .footer a { 
      color: #6366f1; 
      text-decoration: none; 
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>ASPIREMINT</h1>
        <p>Your gateway to premium sponsorships</p>
      </div>
      <div class="content">
        <div class="badge-container">
          <div class="badge">VERIFIED PARTNER</div>
        </div>
        <div class="greeting">Welcome onboard, ${name}!</div>
        <p class="intro">Your credentials have passed verification control rules. Your secure dashboard credentials are now ready for immediate interaction.</p>
        
        <div class="checklist">
          <h3>Onboarding Journey</h3>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <span>Link default UPI payout channel</span>
          </div>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <span>Claim active product review deals</span>
          </div>
          <div class="checklist-item">
            <span class="checklist-icon">✓</span>
            <span>Track orders and claim your refund</span>
          </div>
        </div>

        <div class="cta-container">
          <a href="https://aspiremint.com/dashboard" class="cta-button">Launch Workspace</a>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE COMPLIANCE ENVIRONMENT.</p>
        <p>Need support? Dispatch inquiry to <a href="mailto:support@aspiremint.com">support@aspiremint.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  return transporter.sendMail({
    from: `"AspireMint Onboarding" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `[AspireMint] Welcome to the Specialist Command, ${name}`,
    html,
  });
};
