import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  host: process.env.SMTP_HOST || "smtp.zeptomail.in",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || "emailapikey",
    pass: process.env.SMTP_PASS,
  },
});

if (!process.env.SMTP_PASS) {
  console.warn("WARNING: SMTP_PASS is not set in environment variables.");
}

export function renderSimpleEmail(title: string, headerBg: string, headerColor: string, bodyContent: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0;">
    <div style="background-color: ${headerBg}; padding: 20px; text-align: center; color: ${headerColor}; font-size: 22px; font-weight: bold;">
      ${title}
    </div>
    <div style="padding: 20px; font-size: 14px; color: #333; line-height: 1.5;">
      ${bodyContent}
      <br><br>
      Thanks,<br>
      <b>AspireMint Admin</b><br><br>
      <div style="text-align: center; font-size: 12px; color: #888;">Developed by Team AspireMint 😎</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function renderTable(rows: { label: string; value: string }[]) {
  const trs = rows.map(r => `
    <tr>
      <td style="padding: 10px; border: 1px solid #e0e0e0; font-weight: bold; width: 35%;">${r.label}</td>
      <td style="padding: 10px; border: 1px solid #e0e0e0;">${r.value}</td>
    </tr>
  `).join("");
  return `<table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0; margin: 15px 0;">${trs}</table>`;
}

export const sendOTPEmail = async (
  email: string, 
  name: string, 
  otp: string, 
  context: "LOGIN" | "PAYMENT" | "PASSWORD_RESET" = "LOGIN"
) => {
  let subject = `[AspireMint] Security OTP: ${otp}`;
  let title = "Identity Verification";
  let headerBg = "#4f46e5";
  let intro = "Please use the following single-use code to authenticate.";

  if (context === "PAYMENT") {
    subject = `[AspireMint] Payment Update Security OTP: ${otp}`;
    title = "Payment Details Update";
    headerBg = "#dc3545"; // Red for security alert
    intro = "You are attempting to update your payment details. Please use the following code to authorize this change.";
  } else if (context === "PASSWORD_RESET") {
    subject = `[AspireMint] Password Reset OTP: ${otp}`;
    title = "Password Reset Request";
    intro = "You have requested to reset your password. Please use the following code.";
  }

  const body = `
    Hi <b>${name}</b>,<br><br>
    ${intro}
    ${renderTable([
      { label: "Security Code", value: otp },
      { label: "Valid For", value: "10 Minutes" }
    ])}
    If you did not request this, please ignore this email and secure your account immediately.
  `;
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject,
    html: renderSimpleEmail(title, headerBg, "#ffffff", body),
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

  const title = isApproved ? "Refund Approved" : "Review Rejected";
  const headerBg = isApproved ? "#28a745" : "#dc3545";
  const headerColor = "#ffffff";
  
  const intro = isApproved 
    ? "Your refund claim has been approved." 
    : "Your below order has been rejected.";

  const details = isApproved 
    ? [
        { label: "Order ID", value: orderId },
        { label: "Brand", value: brandName },
        { label: "Product", value: `${productName} (${productCode})` },
        { label: "Approved Amount", value: `₹${amount?.toLocaleString() || "0.00"}` }
      ]
    : [
        { label: "Order ID", value: orderId },
        { label: "Reason", value: note || "Mismatched screenshot evidence" },
        { label: "Mediator", value: "System Specialist" }
      ];

  const body = `
    Hi <b>${name}</b>,<br><br>
    ${intro}
    ${renderTable(details)}
    ${!isApproved ? "Please log in to the portal and fill in the details correctly before resubmitting." : "Payment will be processed soon."}
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject: isApproved
      ? `[AspireMint] ✓ Refund Approved: Order ${orderId}`
      : `[AspireMint] Refund Rejected: Order ${orderId}`,
    html: renderSimpleEmail(title, headerBg, headerColor, body),
  });
};

export const sendOrderCreationEmail = async (email: string, name: string, orderData: any, productImage?: string) => {
  const details = [
    { label: "Brand", value: orderData.brandName || "N/A" },
    { label: "Code", value: orderData.productCode || "N/A" },
    { label: "Order ID", value: orderData.userOrderId || "N/A" },
    { label: "Profile", value: orderData.reviewName || "N/A" },
    { label: "Order Amount", value: `₹${orderData.amount || 0}` },
    { label: "Mediator", value: orderData.mediatorName || "System Auto" }
  ];

  const body = `
    Hi <b>${name}</b>,<br><br>
    Your order has been received successfully. Details are as below:
    ${renderTable(details)}
    Thanks for participating in the campaign.
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject: `[AspireMint] Order Logged: ${orderData.userOrderId}`,
    html: renderSimpleEmail("Order Received", "#ffc107", "#000000", body),
  });
};

export const sendRefundSubmittedEmail = async (email: string, name: string, orderData: any) => {
  const details = [
    { label: "Order ID", value: orderData.userOrderId || "N/A" },
    { label: "Brand", value: orderData.brandName || "N/A" },
    { label: "Product Code", value: orderData.productCode || "N/A" },
    { label: "Refund Amount", value: `₹${orderData.amount || 0}` }
  ];

  const body = `
    Hi <b>${name}</b>,<br><br>
    Your refund form has been submitted successfully and is now pending verification.
    ${renderTable(details)}
    We will notify you once it has been verified.
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject: `[AspireMint] Refund Form Submitted: ${orderData.userOrderId}`,
    html: renderSimpleEmail("Refund Form Submitted", "#17a2b8", "#ffffff", body),
  });
};

export const sendOrderPaymentEmail = async (email: string, name: string, orderId: string, paymentData: any) => {
  const details = [
    { label: "Order ID", value: orderId },
    { label: "Paid Amount", value: `₹${paymentData.paidAmount || "0.00"}` },
    { label: "Transaction ID", value: paymentData.transactionId || "System Auto-gen" },
    { label: "Payment Date", value: new Date(paymentData.paidAt || Date.now()).toLocaleString() },
    { label: "Disbursed By", value: paymentData.paidByName || "Admin Desk" }
  ];

  const body = `
    Hi <b>${name}</b>,<br><br>
    Your refund has been processed. Log in to the portal for detailed information.
    ${renderTable(details)}
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject: `[AspireMint] ₹ Payout Processed: Order ${orderId}`,
    html: renderSimpleEmail("Payout Completed", "#17a2b8", "#ffffff", body),
  });
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const details = [
    { label: "Name", value: name },
    { label: "Email", value: email }
  ];

  const body = `
    Hi <b>${name}</b>,<br><br>
    Welcome to AspireMint! Your account has been successfully created.
    ${renderTable(details)}
    We are excited to have you on board.
  `;

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"AspireMint Admin" <info@aspiremint.in>`,
    to: email,
    subject: "Welcome to AspireMint!",
    html: renderSimpleEmail("Welcome", "#6f42c1", "#ffffff", body),
  });
};
