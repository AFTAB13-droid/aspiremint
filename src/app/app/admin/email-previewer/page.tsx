"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Edit3, Eye, Laptop, Smartphone, Copy, Check, Sparkles, 
  RefreshCw, Trash2, ArrowRight, Settings, Info, CheckCircle2, AlertTriangle, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

type TemplateType = "WELCOME" | "ORDER_CONFIRM" | "REFUND_APPROVED" | "ORDER_SUBMITTED" | "REFUND_REJECTED" | "QUERY_RESOLVED" | "SECURITY_ALERT" | "OTP_VERIFY" | "PAYMENT_OTP";

interface EmailTemplate {
  id: TemplateType;
  name: string;
  subject: string;
  preheader: string;
  description: string;
  defaultVariables: Record<string, string>;
  getHtml: (vars: Record<string, string>) => string;
}

const TEMPLATES: Record<TemplateType, EmailTemplate> = {
  WELCOME: {
    id: "WELCOME",
    name: "User Welcome Onboarding",
    subject: "Welcome to AspireMint - Your Onboarding Journey Begins!",
    preheader: "Get ready to unlock premium verified reviews and brand sponsorships.",
    description: "Sent to new buyers, mediators, and operators upon account creation.",
    defaultVariables: {
      recipientName: "Aarav Sharma",
      userRole: "Buyer Specialist",
      dashboardUrl: "https://aspiremint.com/app",
      supportEmail: "support@aspiremint.com"
    },
    getHtml: (vars) => `
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
      transition: all 0.3s;
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
          <div class="badge">${vars.userRole || "VERIFIED USER"}</div>
        </div>
        <div class="greeting">Welcome onboard, ${vars.recipientName || "Partner"}!</div>
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
          <a href="${vars.dashboardUrl || "#"}" class="cta-button">Launch Workspace</a>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE COMPLIANCE ENVIRONMENT.</p>
        <p>Need support? Dispatch inquiry to <a href="mailto:${vars.supportEmail}">${vars.supportEmail}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  ORDER_CONFIRM: {
    id: "ORDER_CONFIRM",
    name: "Refund Settlement Verified",
    subject: "Refund Settlement Verified: ₹{{refundAmount}} Approved",
    preheader: "Your product review campaign step has been logged and accepted.",
    description: "Sent to the Buyer once a Mediator confirms their review submission screenshot.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      refundAmount: "34,999.00",
      mediatorName: "Priya Patel",
      settlementDateTime: "May 23, 2026 at 01:50 PM"
    },
    getHtml: (vars) => `
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
        <p>Order ID: ${vars.orderId || "N/A"}</p>
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
            <span class="invoice-value">${vars.brandName || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Product Name</span>
            <span class="invoice-value">${vars.productName || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Payer Account</span>
            <span class="invoice-value">${vars.recipientName || "N/A"}</span>
          </div>
          <div class="invoice-row">
            <span class="invoice-label">Clearance Time</span>
            <span class="invoice-value">${vars.settlementDateTime || "N/A"}</span>
          </div>
          <div class="invoice-row total-row">
            <span class="total-label">Refund Disbursed</span>
            <span class="total-value">₹${vars.refundAmount || "0.00"}</span>
          </div>
        </div>

        <div class="mediator-info">
          <span class="mediator-icon">🛡️</span>
          <span>Verified & authorized under standard operating guidelines by dispute specialist <strong>${vars.mediatorName || "System Desk"}</strong>. Payout has cleared escrow for direct credit.</span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  REFUND_APPROVED: {
    id: "REFUND_APPROVED",
    name: "Refund Approved",
    subject: "🎉 Great News! Your Refund for Order #{{orderId}} is Approved",
    preheader: "Your refund claim has been verified and authorized. Processing will begin shortly.",
    description: "Sent automatically to the Buyer when an Admin or SubAdmin approves their refund request.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      productCode: "SM-X510",
      refundAmount: "34,999.00",
      approvedByName: "Admin Command",
      approvedDateTime: "May 23, 2026 at 02:45 PM"
    },
    getHtml: (vars) => `
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
    @keyframes checkDraw {
      from { stroke-dashoffset: 100; }
      to { stroke-dashoffset: 0; }
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
        <p>Order ID: ${vars.orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="success-badge">
          <span class="success-symbol">✓</span>
        </div>
        <h2 class="headline">Refund Authorized!</h2>
        <p class="subheadline">Your claim has been approved</p>

        <div class="amount-hero">
          <div class="amount-label">Approved Refund Amount</div>
          <div class="amount-value">₹${vars.refundAmount || "0.00"}</div>
        </div>

        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Recipient</span>
            <span class="card-value">${vars.recipientName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${vars.brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${vars.productName || "N/A"} (${vars.productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Approved By</span>
            <span class="card-value" style="color: #34d399;">${vars.approvedByName || "Admin"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Approval Time</span>
            <span class="card-value">${vars.approvedDateTime || "N/A"}</span>
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
    `
  },
  ORDER_SUBMITTED: {
    id: "ORDER_SUBMITTED",
    name: "Order Submission Received",
    subject: "Submission Logged: Order #{{orderId}} is Under Review",
    preheader: "Your review submission screenshot and order details have been successfully received.",
    description: "Sent automatically to the Buyer immediately after they submit order review screenshots.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      productCode: "SM-X510",
      productImage: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop",
      reviewType: "5-Star Text & Photo Review",
      refundAmount: "34,999.00",
      submissionDateTime: "May 23, 2026 at 02:22 PM"
    },
    getHtml: (vars) => `
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
        <p>Order ID: ${vars.orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="status-badge">
          <span class="status-symbol"></span>
        </div>
        <h2 class="headline">Refund Form Submitted</h2>
        <p class="subheadline">Verification in progress</p>

        <div class="img-box">
          ${vars.productImage ? `
            <img class="product-img" src="${vars.productImage}" alt="${vars.productName || "Product"}" />
          ` : `
            <div class="img-placeholder">IMAGE NOT PROVIDED</div>
          `}
        </div>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${vars.brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${vars.productName || "N/A"} (${vars.productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Review Type</span>
            <span class="card-value" style="color: #ec4899;">${vars.reviewType || "Standard Review"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Submission Time</span>
            <span class="card-value">${vars.submissionDateTime || "N/A"}</span>
          </div>
          <div class="detail-row total-row">
            <span class="total-label">Expected Refund Amount</span>
            <span class="total-value">₹${vars.refundAmount || "0.00"}</span>
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
    `
  },
  REFUND_REJECTED: {
    id: "REFUND_REJECTED",
    name: "Refund Settle Rejected",
    subject: "Action Required: Refund Submission Rejected for Order #{{orderId}}",
    preheader: "Your review screenshot submission was rejected by our verification specialists.",
    description: "Sent automatically to the Buyer when a Mediator rejects their review screenshot evidence.",
    defaultVariables: {
      recipientName: "Rohan Das",
      orderId: "AM-2026-99281",
      brandName: "Samsung India",
      productName: "Galaxy Tab S9 FE (Graphite)",
      productCode: "SM-X510",
      refundAmount: "34,999.00",
      rejectReason: "Mismatched review screenshot. Uploaded image does not contain the specified Amazon profile identifier or order completion ID matching campaign details.",
      mediatorName: "Karan Johar (Dispute Specialist)",
      rejectDateTime: "May 23, 2026 at 02:29 PM"
    },
    getHtml: (vars) => `
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
        <p>Order ID: ${vars.orderId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="status-badge">
          <span class="status-symbol">!</span>
        </div>
        <h2 class="headline">Submission Rejected</h2>
        <p class="subheadline">Clearance declined</p>

        <div class="reject-box">
          <div class="reject-title">Decline Reason</div>
          <div class="reject-text">${vars.rejectReason || "The submitted screenshot could not be verified."}</div>
        </div>
        
        <div class="detail-card">
          <div class="detail-row">
            <span class="card-label">Sponsor Brand</span>
            <span class="card-value">${vars.brandName || "N/A"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Product</span>
            <span class="card-value">${vars.productName || "N/A"} (${vars.productCode || "N/A"})</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Declined By</span>
            <span class="card-value" style="color: #f87171;">${vars.mediatorName || "System Specialist"}</span>
          </div>
          <div class="detail-row">
            <span class="card-label">Decline Time</span>
            <span class="card-value">${vars.rejectDateTime || "N/A"}</span>
          </div>
          <div class="detail-row total-row">
            <span class="total-label">Expected Refund Amount</span>
            <span class="total-value">₹${vars.refundAmount || "0.00"}</span>
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
    `
  },
  QUERY_RESOLVED: {
    id: "QUERY_RESOLVED",
    name: "Support Inquiry Closed",
    subject: "Resolved: Support Ticket #{{ticketId}} closed",
    preheader: "Good news! Your support ticket has been reviewed and resolved by our specialist team.",
    description: "Sent automatically to the Buyer once an Admin or Mediator closes and resolves their support ticket.",
    defaultVariables: {
      recipientName: "Kabir Mehta",
      ticketId: "TK-98821",
      querySubject: "Missing cashback coordinates for Amazon campaign",
      resolutionSummary: "The escrow payment verification was finalized. Escrow cleared and manually routed to your default UPI destination successfully.",
      resolverName: "Priya Patel (Support Specialist)",
      resolvedAt: "May 23, 2026 at 02:00 PM"
    },
    getHtml: (vars) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Support Inquiry Closed & Resolved</title>
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
    @keyframes checkRipple {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      70% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
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
      background: linear-gradient(135deg, #6366f1, #06b6d4, #10b981); 
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
      animation: checkRipple 2s infinite ease-in-out;
    }
    .status-symbol {
      font-size: 30px;
      color: #6366f1;
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
    .resolution-card { 
      background: rgba(255, 255, 255, 0.02); 
      border: 1.5px solid rgba(99, 102, 241, 0.2); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 25px 0; 
      text-align: left;
    }
    .resolution-row { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding: 12px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .resolution-row:last-child { 
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
    .summary-box { 
      padding-top: 15px; 
      border-top: 1px solid rgba(255, 255, 255, 0.1); 
      font-size: 13px;
    }
    .summary-title {
      font-size: 10px;
      font-weight: 900;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .summary-text {
      color: #cbd5e1;
      font-weight: 600;
      line-height: 1.5;
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
        <h1>Ticket Closed</h1>
        <p>Reference: ${vars.ticketId || "N/A"}</p>
      </div>
      <div class="content">
        <div class="status-badge">
          <span class="status-symbol">✓</span>
        </div>
        <h2 class="headline">Inquiry Resolved</h2>
        <p class="subheadline">Ticket action resolved & locked</p>
        
        <div class="resolution-card">
          <div class="resolution-row">
            <span class="card-label">Recipient</span>
            <span class="card-value">${vars.recipientName || "N/A"}</span>
          </div>
          <div class="resolution-row">
            <span class="card-label">Inquiry Subject</span>
            <span class="card-value">${vars.querySubject || "N/A"}</span>
          </div>
          <div class="resolution-row">
            <span class="card-label">Resolved By</span>
            <span class="card-value" style="color: #10b981;">${vars.resolverName || "N/A"}</span>
          </div>
          <div class="resolution-row">
            <span class="card-label">Resolution Time</span>
            <span class="card-value">${vars.resolvedAt || "N/A"}</span>
          </div>
          <div class="summary-box">
            <div class="summary-title">Resolution Notes</div>
            <div class="summary-text">${vars.resolutionSummary || "The request was successfully resolved."}</div>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  SECURITY_ALERT: {
    id: "SECURITY_ALERT",
    name: "Clearance Level Security",
    subject: "Critical: Security Clearance Level Update Notification",
    preheader: "Your account credentials and security clearance profiles have changed.",
    description: "Sent to operators or Admins when their system security clearance roles are modified.",
    defaultVariables: {
      recipientName: "Vikram Sen",
      authorizerName: "Admin Command",
      previousRole: "MEDIATOR",
      updatedRole: "SUBADMIN",
      ipAddress: "192.168.1.18",
      logTime: "May 23, 2026 at 12:40 PM"
    },
    getHtml: (vars) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Security Clearance Modified</title>
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
    @keyframes alertPulse {
      0% { transform: scale(1); border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { transform: scale(1.08); border-color: rgba(239, 68, 68, 0.8); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
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
      max-width: 540px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #1e293b, #0f172a, #dc2626); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 45px 30px; 
      text-align: center; 
      color: #ffffff; 
      border-bottom: 4px solid #dc2626;
    }
    .header h1 { 
      margin: 0; 
      font-size: 22px; 
      font-weight: 900; 
      letter-spacing: 0.05em; 
      text-transform: uppercase;
      color: #f87171;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 11px; 
      color: #94a3b8; 
      font-weight: bold; 
      text-transform: uppercase;
      letter-spacing: 0.1em;
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
    .alert-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 70px;
      width: 70px;
      background-color: rgba(239, 68, 68, 0.1);
      border-radius: 50%;
      border: 2.5px solid #ef4444;
      margin-bottom: 25px;
      animation: alertPulse 2s infinite ease-in-out;
    }
    .alert-symbol {
      font-size: 32px;
      color: #ef4444;
      font-weight: bold;
    }
    .security-table { 
      background-color: rgba(255, 255, 255, 0.02); 
      border: 1px solid rgba(255, 255, 255, 0.05); 
      border-radius: 20px; 
      padding: 22px; 
      margin: 30px 0; 
      text-align: left; 
    }
    .sec-row { 
      display: flex; 
      justify-content: space-between; 
      padding: 10px 0; 
      border-bottom: 1px dashed rgba(255, 255, 255, 0.06); 
      font-size: 13px; 
    }
    .sec-row:last-child { 
      border-bottom: none; 
    }
    .sec-label { 
      color: #64748b; 
      font-weight: 800; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .sec-val { 
      color: #ffffff; 
      font-weight: 800; 
    }
    .critical-alert {
      text-align: left;
      font-size: 12px;
      color: #f87171;
      font-weight: 700;
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
      color: #ef4444;
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
        <h1>Clearance Level Modification</h1>
        <p>System Privileges Adjusted</p>
      </div>
      <div class="content">
        <div class="alert-badge">
          <span class="alert-symbol">⚠️</span>
        </div>
        <div class="greeting">Dear Operator ${vars.recipientName || "Operator"},</div>
        <p class="intro">This automated security alert is to inform you that your system security clearance settings have been programmatically updated in our core authentication servers.</p>
        
        <div class="security-table">
          <div class="sec-row">
            <span class="sec-label">Authorizer Desk</span>
            <span class="sec-val">${vars.authorizerName || "System Desk"}</span>
          </div>
          <div class="sec-row">
            <span class="sec-label">Previous Access Profile</span>
            <span class="sec-val" style="color: #64748b;">${vars.previousRole || "N/A"}</span>
          </div>
          <div class="sec-row">
            <span class="sec-label">Updated Access Profile</span>
            <span class="sec-val" style="color: #6366f1;">${vars.updatedRole || "N/A"}</span>
          </div>
          <div class="sec-row">
            <span class="sec-label">Log Source IP</span>
            <span class="sec-val" style="font-family: monospace;">${vars.ipAddress || "N/A"}</span>
          </div>
          <div class="sec-row">
            <span class="sec-label">Modification Timestamp</span>
            <span class="sec-val">${vars.logTime || "N/A"}</span>
          </div>
        </div>

        <p class="critical-alert">
          ⚠️ WARNING: If you did not request this update or believe this modification is in error, please immediately alert a Platform Principal Administrator or revoke your active login sessions.
        </p>

        <div class="meta-box">
          <span class="meta-title">SECURITY METRICS LOG</span>
          <span>• Active Directory Security Protocol: <strong>TLS_1.3_AES_GCM</strong></span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  OTP_VERIFY: {
    id: "OTP_VERIFY",
    name: "OTP Code Authentication",
    subject: "{{otpCode}} is your AspireMint Verification Code",
    preheader: "Enter this one-time code within 10 minutes to verify your login identity.",
    description: "Sent to users during login, password reset, or payout validation steps.",
    defaultVariables: {
      recipientName: "Kabir Mehta",
      otpCode: "882910",
      ipAddress: "152.57.88.201",
      expiresInMinutes: "10"
    },
    getHtml: (vars) => `
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
        <div class="greeting">Hello ${vars.recipientName || "User"},</div>
        <p class="intro">Please use the following single-use credentials code to complete registration or login authentication. Protect this code immediately.</p>
        
        <div class="otp-banner">
          <div class="otp-code">${vars.otpCode || "------"}</div>
          <div class="expires-info">VALID FOR ${vars.expiresInMinutes || "10"} MINUTES</div>
        </div>

        <p class="warn-text">
          If you did not execute this authentication workflow, please log in immediately to confirm no unauthorized sessions exist.
        </p>

        <div class="meta-box">
          <span class="meta-title">REQUEST META INFO</span>
          <span>• Authorized IP Address: <strong>${vars.ipAddress || "N/A"}</strong></span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE COMPLIANCE DESK.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  PAYMENT_OTP: {
    id: "PAYMENT_OTP",
    name: "Payment OTP Authorization",
    subject: "Security: {{otpCode}} to update your Payout Details",
    preheader: "Verify your payout details update request before changes are permanently saved.",
    description: "Sent when users request to modify or update their default bank account/UPI ID payout coordinates.",
    defaultVariables: {
      recipientName: "Sneha Iyer",
      otpCode: "992816",
      updatedDetails: "UPI ID: sneha.iyer@okhdfcbank (Replacing State Bank account ending 9928)",
      ipAddress: "103.88.221.14",
      expiresInMinutes: "5"
    },
    getHtml: (vars) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authorize Payment Details Change</title>
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
    @keyframes warningAlert {
      0% { border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
      50% { border-color: rgba(239, 68, 68, 0.7); box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
      100% { border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
    }
    @keyframes warningGlow {
      0% { color: #f59e0b; }
      50% { color: #ef4444; }
      100% { color: #f59e0b; }
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
      max-width: 520px; 
      margin: 0 auto; 
      background: #111827; 
      border-radius: 36px; 
      border: 1px solid rgba(255, 255, 255, 0.08); 
      overflow: hidden; 
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .header { 
      background: linear-gradient(135deg, #0f172a, #1e293b, #ef4444); 
      background-size: 300% 300%;
      animation: gradientShift 10s ease infinite;
      padding: 45px 30px; 
      text-align: center; 
      color: #ffffff; 
      border-bottom: 4px solid #ef4444;
    }
    .header h1 { 
      margin: 0; 
      font-size: 22px; 
      font-weight: 900; 
      letter-spacing: 0.05em; 
      text-transform: uppercase;
      color: #f59e0b;
      animation: warningGlow 3s infinite ease-in-out;
    }
    .header p { 
      margin: 8px 0 0 0; 
      font-size: 12px; 
      color: #94a3b8; 
      font-weight: bold; 
      text-transform: uppercase;
      letter-spacing: 0.1em;
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
      background-color: rgba(239, 68, 68, 0.02); 
      border: 2px dashed rgba(245, 158, 11, 0.3); 
      border-radius: 24px; 
      padding: 25px; 
      margin: 25px 0; 
      display: inline-block; 
      width: 85%; 
      animation: warningAlert 4s infinite ease-in-out;
    }
    .otp-code { 
      font-size: 40px; 
      font-weight: 900; 
      color: #f59e0b; 
      letter-spacing: 0.25em; 
      font-family: monospace; 
      margin: 0; 
    }
    .expires-info { 
      font-size: 10px; 
      font-weight: 900; 
      color: #ef4444; 
      margin-top: 8px; 
      text-transform: uppercase; 
      letter-spacing: 0.15em; 
    }
    .detail-card { 
      background-color: rgba(255, 255, 255, 0.02); 
      border: 1px solid rgba(255, 255, 255, 0.05); 
      border-radius: 20px; 
      padding: 22px; 
      margin: 30px 0; 
      text-align: left; 
    }
    .detail-title { 
      font-size: 10px; 
      font-weight: 900; 
      color: #ef4444; 
      text-transform: uppercase; 
      letter-spacing: 0.1em; 
      margin-bottom: 8px; 
    }
    .detail-val { 
      font-size: 13px; 
      font-weight: 800; 
      color: #ffffff; 
      line-height: 1.4; 
    }
    .critical-alert {
      text-align: left;
      font-size: 12px;
      color: #f87171;
      font-weight: 700;
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
      color: #f59e0b;
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
        <h1>Payment Control Authorization</h1>
        <p>Security verification code requested</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${vars.recipientName || "User"},</div>
        <p class="intro">We received a request to update the registered default payout/UPI details on your AspireMint account files. Enter this one-time code to authorize this change.</p>
        
        <div class="otp-banner">
          <div class="otp-code">${vars.otpCode || "------"}</div>
          <div class="expires-info">VALID FOR ${vars.expiresInMinutes || "5"} MINUTES</div>
        </div>

        <div class="detail-card">
          <div class="detail-title">Proposed Changes</div>
          <div class="detail-val">${vars.updatedDetails || "No details specified"}</div>
        </div>

        <p class="critical-alert">
          ⚠️ CRITICAL WARNING: If you did not request this update, someone else might be attempting to hijack your payout funds destination. Reject this change and contact support immediately.
        </p>

        <div class="meta-box">
          <span class="meta-title">REQUEST META INFO</span>
          <span>• Requested IP Address: <strong>${vars.ipAddress || "N/A"}</strong></span>
        </div>
      </div>
      <div class="footer">
        <p>© 2026 ASPIREMINT SYSTEMS. SECURE LEDGER SYSTEM.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  }
};

export default function EmailPreviewerPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("WELCOME");
  const [variables, setVariables] = useState<Record<string, string>>(
    TEMPLATES.WELCOME.defaultVariables
  );
  
  const [previewDevice, setPreviewDevice] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  const [activeTab, setActiveTab] = useState<"PREVIEW" | "HTML">("PREVIEW");
  const [isCopied, setIsCopied] = useState(false);

  const activeTemplate = TEMPLATES[selectedTemplate];

  const handleTemplateChange = (id: TemplateType) => {
    setSelectedTemplate(id);
    setVariables(TEMPLATES[id].defaultVariables);
    setIsCopied(false);
  };

  const handleVariableChange = (key: string, val: string) => {
    setVariables(prev => ({ ...prev, [key]: val }));
    setIsCopied(false);
  };

  const compiledHtml = useMemo(() => {
    return activeTemplate.getHtml(variables);
  }, [activeTemplate, variables]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(compiledHtml);
    setIsCopied(true);
    toast.success("📋 Email HTML Template Copied to Clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-4 lg:p-8 bg-slate-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md uppercase tracking-[0.25em]">Admin Support Tools</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-3">
              <Mail className="w-8 h-8 text-indigo-600" /> Transactional Email Live Previewer
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
              ✨ Temporary Workspace: Real-time transactional email designer, custom variable editors, and mobile/desktop HTML renderer.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-indigo-900 text-indigo-100 px-5 py-3 rounded-2xl shadow-md border border-indigo-800">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Temporary Admin clearance Page</span>
          </div>
        </div>

        {/* Workspace Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Template list & Variable Editors */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Template Selector Box */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-xl border border-slate-100 space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-900 uppercase tracking-tight italic">Email Template Catalog</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select standard email layout to audit</p>
              </div>

              <div className="space-y-3">
                {Object.values(TEMPLATES).map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl.id)}
                    className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-4 ${
                      selectedTemplate === tmpl.id 
                        ? "bg-indigo-50 border-indigo-100 text-indigo-900 shadow-sm" 
                        : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedTemplate === tmpl.id 
                        ? "bg-indigo-600 text-white" 
                        : "bg-slate-200/60 text-slate-400"
                    }`}>
                      <Mail size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wide truncate">{tmpl.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 leading-snug">{tmpl.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Parameter Customizer Box */}
            <div className="bg-white rounded-[40px] p-6 lg:p-8 shadow-xl border border-slate-100 space-y-6">
              <div>
                <h3 className="text-md font-black text-slate-900 uppercase tracking-tight italic flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-600 animate-pulse" /> Content Variables Editor
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Change content strings to preview dynamic variables</p>
              </div>

              <div className="space-y-4">
                {Object.keys(activeTemplate.defaultVariables).map(key => (
                  <div key={key} className="space-y-1.5 pl-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type="text"
                      value={variables[key] || ""}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <button
                  onClick={() => setVariables(activeTemplate.defaultVariables)}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={10} /> Reset Default Values
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Live Frame viewport */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Viewport Frame Box */}
            <div className="bg-slate-900 text-white rounded-[44px] p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col h-[700px] justify-between">
              
              {/* Top Control Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 relative z-10 shrink-0">
                
                {/* Mode Selectors */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
                  <button
                    onClick={() => setActiveTab("PREVIEW")}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      activeTab === "PREVIEW" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Live Preview Frame
                  </button>
                  <button
                    onClick={() => setActiveTab("HTML")}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors ${
                      activeTab === "HTML" 
                        ? "bg-indigo-600 text-white shadow" 
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Raw HTML Source
                  </button>
                </div>

                {/* Device Sizers (Only in PREVIEW tab) */}
                {activeTab === "PREVIEW" && (
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 self-start">
                    <button
                      onClick={() => setPreviewDevice("DESKTOP")}
                      className={`h-8 w-12 flex items-center justify-center rounded-lg transition-colors ${
                        previewDevice === "DESKTOP" 
                          ? "bg-indigo-600 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Desktop View"
                    >
                      <Laptop size={14} />
                    </button>
                    <button
                      onClick={() => setPreviewDevice("MOBILE")}
                      className={`h-8 w-12 flex items-center justify-center rounded-lg transition-colors ${
                        previewDevice === "MOBILE" 
                          ? "bg-indigo-600 text-white" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                      title="Mobile View"
                    >
                      <Smartphone size={14} />
                    </button>
                  </div>
                )}

              </div>

              {/* Viewport Canvas Body */}
              <div className="flex-1 my-6 overflow-hidden relative flex justify-center items-center">
                <AnimatePresence mode="wait">
                  
                  {activeTab === "PREVIEW" ? (
                    <motion.div
                      key={`preview-${previewDevice}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className={`h-full w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-white/5 shadow-inner transition-all duration-500`}
                    >
                      
                      {/* Interactive responsive frame container */}
                      <div 
                        className={`h-full bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${
                          previewDevice === "DESKTOP" 
                            ? "w-full max-w-full" 
                            : "w-[340px]"
                        }`}
                      >
                        
                        {/* Chrome bar header */}
                        <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                          </div>
                          <span className="text-[7px] font-black uppercase text-slate-400 font-mono tracking-widest truncate max-w-[200px]">
                            {activeTemplate.subject}
                          </span>
                          <div className="w-10" />
                        </div>

                        {/* Interactive iframe dynamic rendering */}
                        <iframe
                          title="Email Live Frame"
                          srcDoc={compiledHtml}
                          className="w-full h-[calc(100%-32px)] border-none bg-slate-50"
                        />

                      </div>

                    </motion.div>
                  ) : (
                    <motion.div
                      key="source-html"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full w-full bg-slate-950 rounded-2xl p-6 border border-white/5 overflow-y-auto custom-scrollbar font-mono text-[9px] text-indigo-200/90 whitespace-pre-wrap select-all leading-normal"
                    >
                      {compiledHtml}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Compiled HTML Size: {Math.round(compiledHtml.length / 1024 * 100) / 100} KB
                  </span>
                </div>
                
                <button
                  onClick={handleCopyCode}
                  className="px-6 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 self-end active:scale-95 transition-all"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" /> Copied HTML Code
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Raw HTML Code
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
