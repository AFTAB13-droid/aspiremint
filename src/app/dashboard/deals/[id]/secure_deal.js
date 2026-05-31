const fs = require('fs');
const path = require('path');

const dealPagePath = path.resolve('src/app/dashboard/deals/[id]/page.tsx');
if (fs.existsSync(dealPagePath)) {
  let content = fs.readFileSync(dealPagePath, 'utf8');

  // Add subadmin checks and mask helpers inside the component
  if (!content.includes('const isSubAdmin = role === "SUBADMIN";')) {
    content = content.replace(
      'const role = (session?.user as any)?.role || "USER";',
      'const role = (session?.user as any)?.role || "USER";\n' +
      '  const isSubAdmin = role === "SUBADMIN";\n\n' +
      '  const maskName = (name: string) => {\n' +
      '    if (!name) return "N/A";\n' +
      '    const parts = name.split(" ");\n' +
      '    return parts.map(p => p.length > 2 ? `${p[0]}***${p.slice(-1)}` : `${p[0]}*`).join(" ");\n' +
      '  };\n\n' +
      '  const maskUpi = (upi: string) => {\n' +
      '    if (!upi) return "N/A";\n' +
      '    const [local, domain] = upi.split("@");\n' +
      '    if (!domain) return "****";\n' +
      '    return `${local.slice(0, 2)}***@${domain}`;\n' +
      '  };'
    );
  }

  // 1. Restrict commission parameters editor button to ADMIN / MEDIATOR only
  content = content.replaceAll(
     '{(isAdm || isMed) && order.status !== \'COMPLETED\' && (',
     '{(role === "ADMIN" || isMed) && order.status !== \'COMPLETED\' && ('
  );

  // 2. Mask UPI ID & Payee Name in Desktop Refund Details (lines 399-405)
  content = content.replace(
    `{order.refundDetails.upiId || 'N/A'}`,
    `{isSubAdmin ? maskUpi(order.refundDetails.upiId || '') : (order.refundDetails.upiId || 'N/A')}`
  );
  content = content.replace(
    `{order.refundDetails.accountHolderName || 'N/A'}`,
    `{isSubAdmin ? maskName(order.refundDetails.accountHolderName || '') : (order.refundDetails.accountHolderName || 'N/A')}`
  );

  // 3. Mask Buyer Mobile & Name in Desktop (lines 445-468)
  content = content.replace(
    `{order.buyer?.name}`,
    `{isSubAdmin ? maskName(order.buyer?.name || '') : order.buyer?.name}`
  );
  content = content.replace(
    `+91 {order.buyer.mobile}`,
    `{isSubAdmin ? \`+91 \${order.buyer.mobile.slice(0, 3)}*****\${order.buyer.mobile.slice(-2)}\` : \`+91 \${order.buyer.mobile}\`}`
  );

  // 4. Mask Mediator Name in Desktop (lines 472-485)
  content = content.replace(
    `{order.mediator?.name}`,
    `{isSubAdmin ? maskName(order.mediator?.name || '') : order.mediator?.name}`
  );

  // 5. Mask UPI ID in Mobile view (lines 708)
  content = content.replace(
    `{order.refundDetails.upiId || 'N/A'}`,
    `{isSubAdmin ? maskUpi(order.refundDetails.upiId || '') : (order.refundDetails.upiId || 'N/A')}`
  );

  // 6. Mask Buyer/Specialist Name in Mobile view (lines 720-736)
  content = content.replace(
    `<p className="text-xs font-black text-slate-900 uppercase mt-0.5">{order.buyer?.name}</p>`,
    `<p className="text-xs font-black text-slate-900 uppercase mt-0.5">{isSubAdmin ? maskName(order.buyer?.name || '') : order.buyer?.name}</p>`
  );
  content = content.replace(
    `<p className="text-xs font-black text-slate-900 uppercase mt-0.5">{order.mediator?.name}</p>`,
    `<p className="text-xs font-black text-slate-900 uppercase mt-0.5">{isSubAdmin ? maskName(order.mediator?.name || '') : order.mediator?.name}</p>`
  );

  fs.writeFileSync(dealPagePath, content, 'utf8');
  console.log('Successfully updated src/app/dashboard/deals/[id]/page.tsx');
} else {
  console.error('File not found: src/app/dashboard/deals/[id]/page.tsx');
}
