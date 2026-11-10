import OpenAI from "openai";
import connectToDatabase from "@/lib/db";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { ActiveDeal } from "@/modules/brand/deal.model";
import { ReferralService } from "@/services/referral.service";
import formatDate from "@/utils/formatDate";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface UserContext {
  userId: string;
  name: string;
  email: string;
  role: string;
  aspireMintId?: string;
}

export interface InteractiveCard {
  type: "ORDER_STATUS" | "DEAL_LIST" | "WALLET_SUMMARY" | "WHATSAPP_PITCH_LIST" | "ACTION_LINK" | "FAQ_GUIDE";
  data: any;
}

export interface SanaChatResponse {
  reply: string;
  speechText: string;
  cards?: InteractiveCard[];
  quickSuggestions?: string[];
  celebrate?: boolean;
}

// Strip markdown, URLs, symbols for natural browser speech synthesis
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // replace markdown links [text](url) with just text
    .replace(/[*_#`~>]/g, "") // remove formatting characters
    .replace(/https?:\/\/\S+/g, "") // remove bare URLs
    .replace(/[✨🌸📦🎁👛⚡✅⏳❌🛡️👋🎉🪔💥🚀🪙💸🥳📚🎓🛍️]/g, "") // remove emojis for smoother pronunciation
    .replace(/\s+/g, " ")
    .trim();
}

export class AiChatService {
  /**
   * Main conversation processor for Sana AI
   */
  static async processConversation(
    messages: { role: "user" | "assistant"; content: string }[],
    user: UserContext
  ): Promise<SanaChatResponse> {
    await connectToDatabase();

    // 1. Tool Definitions for OpenAI Tool Calling
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "lookup_order",
          description:
            "Look up detailed order information, refund form status, review approval, expected refund date, brand, and UTR payment details by Order ID. If the order is refunded or completed, Sana triggers a celebration!",
          parameters: {
            type: "object",
            properties: {
              orderId: {
                type: "string",
                description:
                  "The Aspire Order ID (e.g. AM-1042) or Amazon/Flipkart order ID (e.g. 402-8273612-9182371).",
              },
            },
            required: ["orderId"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_my_active_orders",
          description:
            "Get a list of the buyer's recent and active orders so Sana can tell them what orders they currently have in progress.",
          parameters: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Max orders to retrieve (default 5).",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_wallet_and_referral_summary",
          description:
            "Get the buyer's current digital wallet balance (Available cash, Pending 7-day escrow) and Refer & Earn progress.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "find_active_deals",
          description:
            "Search available 100% cashback deals currently live on AspireMint by keyword or marketplace.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search keyword like 'earbuds', 'watch', 'boat', 'amazon', etc.",
              },
              limit: {
                type: "number",
                description: "Max deals to return (default 4).",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "generate_whatsapp_referral_pitch",
          description:
            "Generate viral, high-converting WhatsApp referral pitches customized for college friends, family, or general shopping hack with 1-tap WhatsApp share buttons and the buyer's personal invite link.",
          parameters: {
            type: "object",
            properties: {
              style: {
                type: "string",
                enum: ["ALL", "COLLEGE", "SHOPPING_DEALS", "CASUAL_HINGLISH"],
                description: "Target audience for the WhatsApp pitch.",
              },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "explain_platform_rules",
          description:
            "Get authoritative AspireMint policy rules on 100% cashback, 7-day safety escrow, referral earnings, or cancellation rules.",
          parameters: {
            type: "object",
            properties: {
              topic: {
                type: "string",
                enum: [
                  "COMPLETE_PROCESS",
                  "HOW_TO_ORDER",
                  "REVIEW_LINKS",
                  "REFUND_TIMELINE",
                  "DAMAGED_OR_WRONG_PRODUCT",
                  "DELETED_REVIEW",
                  "EXCHANGE_OR_EMPTY_BOX",
                  "REFER_AND_EARN",
                  "ORDER_SCREENSHOTS",
                  "AMAZON_COUPONS_AND_SELLERS",
                  "MULTIPLE_ACCOUNTS",
                ],
                description: "The specific FAQ topic to explain.",
              },
            },
            required: ["topic"],
          },
        },
      },
    ];

    // 2. Comprehensive System Knowledge Base (Trained on Client's Official FAQ Sheet)
    const systemPrompt = `You are Sana, the official, highly intelligent, friendly, and charismatic female AI assistant for AspireMint (an exclusive 100% cashback rebate platform for verified Amazon & Flipkart shoppers in India).

CHARACTER & VOICE:
- Name: Sana (AspireMint AI)
- Personality: Warm, polite, cheerful, highly knowledgeable, empathetic, and sweet.
- Tone: Natural, engaging, and respectful. You love helping shoppers save money and track their deals!
- Conversational Style: Never say robotic technical phrases like "I was trained on data" or "According to my training". Always speak naturally like a caring, knowledgeable concierge at AspireMint.
- Clean Formatting: Format key labels cleanly like "**Refund Form Submitted:** Yes" or "**Expected Refund Date:** 18 Nov 2026". Never output redundant double asterisks like "**Expected Refund Date:** **18 Nov 2026**". Keep text clean, readable, and modern.
- Language: You natively speak fluent English, Hindi, and natural Hinglish (e.g. "Namaste Rahul! Aapka refund form check karti hoon..."). Always respond in the language or style the user speaks to you.
- Spoken Audio: Keep your answers crisp, well-structured, and clear (2 to 4 sentences or clean bullet points) because your reply will also be spoken aloud with voice audio!

OFFICIAL ASPIREMINT CLIENT FAQ KNOWLEDGE BASE (STRICTLY ADHERE TO THESE ANSWERS):

1. COMPLETE ORDER-TO-REFUND PROCESS:
   - Step 1: Browse Deals on the portal or WhatsApp group posted by Juhi. If interested, request the link from Juhi and place the order on the marketplace (or place directly from portal if actively listed).
   - Step 2: Submit Order Form IMMEDIATELY: Copy the Order ID, take order confirmation screenshot, and submit Order Form (mandatory for refund eligibility).
   - Step 3: Delivery & Review:
     * Amazon: Post review/rating 3–4 days AFTER delivery.
     * Flipkart & Other Marketplaces: Submit review on the DAY of delivery.
   - Step 4: Wait for Review to be publicly visible live on the product page.
   - Step 5: Submit Refund Form with screenshot of live review.
   - Step 6: Team verifies and processes refund (typically 25 to 30 days after form submission and review verification).

2. LINKS & TOOLS:
   - Flipkart Review Finder: [Flipkart Review Link Tool](https://deals.aspiremint.in/app/review-finder) (or /app/review-finder).
   - Amazon Review Link Guide Video: [YouTube Step-by-Step Guide](https://www.youtube.com/watch?v=bXX5tXqlnKU).
   - Order Tracking Link: [Track Orders](https://deals.aspiremint.in/app/orders/track) (or /app/orders/track).
   - Refund & Payout Dashboard: [Refunds Dashboard](https://deals.aspiremint.in/app/refunds) (or /app/refunds).
   - Official Support & Deal Email: info@aspiremint.in.

3. SCREENSHOT GUIDELINES:
   - Order Screenshot: Marketplace order confirmation showing Order ID, product details, order date, and delivery address.
   - Review Screenshot: Image showing published review and star rating live on the product page.
   - Blinkit Invoice Screenshot: Official order receipt/tax invoice downloaded from the Blinkit app.
   - Return Period Over Screenshot: Image confirming the marketplace return/replacement window has expired.
   - Reference Section in portal shows sample images for all of these.

4. SPECIAL ISSUE RESOLUTION:
   - Received Wrong Product or Broken/Damaged Product:
     * DO NOT initiate a return on Amazon/Flipkart without confirmation!
     * Contact support (info@aspiremint.in) immediately so it can be escalated to Juhi or Toufik. Await their instructions.
   - Amazon Review Deleted or Removed:
     * Submit an UNVERIFIED review for the product using a secondary Amazon account (search product ➔ Write a review under Customer Reviews ➔ submit & screenshot once published).
   - Multiple Slots of Same Product:
     * Amazon: NO, cannot take multiple slots of the same product even from different accounts (Amazon will suspect it).
     * Other Marketplaces (Flipkart, etc.): YES, multiple slots are allowed.
   - Multiple Amazon Accounts on Same Mobile Device:
     * Strongly recommended AGAINST using multiple Amazon accounts on the same device (Amazon may restrict accounts). Use separate devices.
   - Reordering Cancelled Orders:
     * If an order is cancelled for any reason, buyer must obtain permission and confirmation from Juhi before reordering.

5. SPECIAL DEAL TYPES:
   - Search & Order Deal: Buyer is given specific keywords and brand name to search on Amazon rather than a direct link. Verify seller matches instructions before ordering.
   - Exchange Deal: Order a designated product on the marketplace, but receive the specific product posted by Juhi and selected by the buyer.
   - Empty Box Deal: An empty package is delivered. Buyer receives 100% refund of order amount + agreed commission payout!

6. AMAZON ORDER RULES:
   - Selecting Correct Seller: Go to "Other sellers on Amazon" or "See all buying choices" below Buy Now button, find the requested seller, click "Add to Cart" next to that seller.
   - Coupons & Vouchers: YES, if a coupon or voucher is available on the Amazon product page, it is MANDATORY to apply it before checkout.
   - Review Links by Platform:
     * Amazon: Refund Form can be submitted WITHOUT a review link by providing the required screenshot.
     * Flipkart: Review link is MANDATORY.
     * Meesho / Myntra / Nykaa: Direct review links do not exist; clear screenshot of published review is required.

7. REFUND TIMELINE & PAYOUT INQUIRIES:
   - Timeline: Typically 25 to 30 days after review is live and Refund Form is verified.
   - "Email says refunded but money not received": Check bank/UPI statement 4–5 days before and after email date. Payouts may take 1–2 business days depending on UPI/bank processing.
   - Due Date for Refund Form: Recommended deadline once review is published. Late submissions delay brand settlements and penalty deductions may apply.
   - If Refund Form is Rejected: Review mediator feedback, make required corrections, and resubmit Refund Form.

8. REFER & EARN RULES:
   - Earn up to ₹90 per referred friend:
     * ₹50 Base Reward on friend's 1st Amazon verified deal!
     * ₹10 each on next 4 verified deals (4 x ₹10 = ₹40).
   - Min UPI payout: ₹100. Max wallet cap: ₹900.
   - 7-Day Safety Escrow: Pending rewards move to Available cash 7 days after order verification to protect against cancellation/returns.

SPECIAL CELEBRATION & VIRAL RULES:
- If a user's order is REFUNDED or COMPLETED, celebrate with them (e.g., "Badhaai ho! 🎉 Your refund has been disbursed! UTR: ...") and trigger celebration!
- When asked about WhatsApp invites or referring, call "generate_whatsapp_referral_pitch" tool!

CURRENT USER CONTEXT:
- Name: ${user.name || "Valued Shopper"}
- Email: ${user.email}
- AspireMint ID: ${user.aspireMintId || "N/A"}
- Role: ${user.role}`;

    // 3. Assemble chat payload
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-8).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const cards: InteractiveCard[] = [];
    let shouldCelebrate = false;
    let quickSuggestions: string[] = [
      "📦 Where is my refund?",
      "📚 Complete refund process guide",
      "📲 Create WhatsApp invite message",
      "🎁 Live 100% cashback deals",
    ];

    // Check if user explicitly asked to celebrate or test celebration
    const latestUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
    if (latestUserMsg.includes("celebrat") || latestUserMsg.includes("badhaai") || latestUserMsg.includes("party")) {
      shouldCelebrate = true;
    }

    // 4. First OpenAI Completion Call
    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 550,
    });

    let assistantMessage = completion.choices[0]?.message;

    // 5. Handle Tool Calls Loop (if Sana decides to call functions)
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      apiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const functionName = toolCall.function.name;
        let functionArgs: any = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          functionArgs = {};
        }

        let functionResult: any = {};

        if (functionName === "lookup_order") {
          const res = await this.toolLookupOrder(functionArgs.orderId, user.userId);
          functionResult = res;
          if (res.found && res.order) {
            cards.push({
              type: "ORDER_STATUS",
              data: res.order,
            });

            if (res.order.celebrate) {
              shouldCelebrate = true;
            }

            quickSuggestions = [
              "📲 Invite friends & earn ₹90",
              "View full order details",
              "Show 100% cashback deals",
            ];
          }
        } else if (functionName === "get_my_active_orders") {
          const res = await this.toolGetMyActiveOrders(user.userId, functionArgs.limit);
          functionResult = res;
          if (res.orders && res.orders.length > 0) {
            quickSuggestions = res.orders.slice(0, 3).map((o: any) => `Track ${o.aspireOrderId || o.brandName}`);
          }
        } else if (functionName === "get_wallet_and_referral_summary") {
          const res = await this.toolGetWalletSummary(user.userId);
          functionResult = res;
          cards.push({
            type: "WALLET_SUMMARY",
            data: res,
          });
          quickSuggestions = [
            "📲 Create WhatsApp invite message",
            "How do I withdraw to UPI?",
            "Find new 100% deals",
          ];
        } else if (functionName === "find_active_deals") {
          const res = await this.toolFindDeals(functionArgs.query, functionArgs.limit);
          functionResult = res;
          if (res.deals && res.deals.length > 0) {
            cards.push({
              type: "DEAL_LIST",
              data: res.deals,
            });
            quickSuggestions = [
              "How do 100% cashback deals work?",
              "Do I need an Amazon account?",
              "Check my orders",
            ];
          }
        } else if (functionName === "generate_whatsapp_referral_pitch") {
          const res = await this.toolGenerateWhatsAppPitches(user.userId, user.name, functionArgs.style);
          functionResult = res;
          if (res.pitches && res.pitches.length > 0) {
            cards.push({
              type: "WHATSAPP_PITCH_LIST",
              data: res.pitches,
            });
            quickSuggestions = [
              "How do I earn ₹90 per friend?",
              "Check my wallet balance",
              "Show 100% cashback deals",
            ];
          }
        } else if (functionName === "explain_platform_rules") {
          functionResult = {
            status: "Policy provided in knowledge base",
            topic: functionArgs.topic,
          };
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      // Second Completion Call with tool results
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = completion.choices[0]?.message;
    }

    const reply =
      assistantMessage?.content ||
      "Namaste! I'm here to assist you with your AspireMint orders, cashback deals, and referral rewards. What can I check for you?";
    const speechText = cleanTextForSpeech(reply);

    return {
      reply,
      speechText,
      cards: cards.length > 0 ? cards : undefined,
      quickSuggestions,
      celebrate: shouldCelebrate,
    };
  }

  // --- TOOL IMPLEMENTATIONS ---

  private static async toolLookupOrder(orderIdQuery: string, userId: string) {
    if (!orderIdQuery) return { found: false, message: "Please provide an Order ID." };

    const cleanId = orderIdQuery.trim();

    // Search by aspireOrderId (e.g. AM-1042) or userOrderId or _id
    const order = await Order.findOne({
      buyer: userId,
      $or: [
        { aspireOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
        { userOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
        ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
      ],
    }).lean();

    if (!order) {
      const existsElsewhere = await Order.exists({
        $or: [
          { aspireOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
          { userOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
        ],
      });

      if (existsElsewhere) {
        return {
          found: false,
          message: "Order found, but it belongs to another account for privacy reasons.",
        };
      }

      return {
        found: false,
        message: `No order found matching "${cleanId}". Please check your Order ID in the Orders tab or track via /app/orders/track.`,
      };
    }

    const isRefunded = [OrderStatus.REFUNDED, OrderStatus.COMPLETED].includes(order.status as any);

    // Human-friendly status translation
    let statusLabel = "In Progress";
    let statusColor = "amber";
    switch (order.status) {
      case OrderStatus.REFUND_FORM_PENDING:
        statusLabel = "Awaiting Refund Form Submission";
        statusColor = "amber";
        break;
      case OrderStatus.UNDER_VERIFICATION:
      case OrderStatus.REFUND_FORM_SUBMITTED:
        statusLabel = "Refund Form Submitted • Under Review";
        statusColor = "blue";
        break;
      case OrderStatus.REFUND_APPROVED:
        statusLabel = "Review Approved • Payout Queued";
        statusColor = "emerald";
        break;
      case OrderStatus.REFUNDED:
      case OrderStatus.COMPLETED:
        statusLabel = "Refund Completed • Money Disbursed 🎉";
        statusColor = "emerald";
        break;
      case OrderStatus.REFUND_REJECTED:
        statusLabel = "Refund Form Rejected";
        statusColor = "rose";
        break;
      default:
        statusLabel = order.status.replace(/_/g, " ");
    }

    const submittedDate = (order as any).refundDetails?.submittedAt || order.createdAt;
    const estRefundDate = new Date(submittedDate);
    estRefundDate.setDate(estRefundDate.getDate() + 25); // Typically 25-30 days campaign cycle per FAQ

    const orderData = {
      orderId: (order as any)._id.toString(),
      aspireOrderId: order.aspireOrderId,
      userOrderId: order.userOrderId,
      brandName: order.brandName,
      productCode: order.productCode,
      reviewName: order.reviewName,
      marketplace: (order as any).marketplace || "Amazon",
      amount: order.amount,
      status: order.status,
      statusLabel,
      statusColor,
      isRefunded,
      celebrate: isRefunded,
      formSubmittedAt: (order as any).refundDetails?.submittedAt
        ? formatDate(new Date((order as any).refundDetails.submittedAt).toISOString())
        : "Not submitted yet",
      isFormSubmitted: !!(order as any).refundDetails?.submittedAt,
      expectedRefundDate: formatDate(estRefundDate.toISOString()),
      rejectionReason: (order as any).refundDetails?.rejectionNote || (order as any).cancellationReason || null,
      payoutUtr: (order as any).paymentDetails?.transactionId || null,
      paidAt: (order as any).paymentDetails?.paidAt ? formatDate(new Date((order as any).paymentDetails.paidAt).toISOString()) : null,
      actionUrl: `/app/orders/${(order as any)._id}`,
      fillFormUrl: `/app/refunds/fill/${(order as any)._id}`,
    };

    return {
      found: true,
      order: orderData,
    };
  }

  private static async toolGetMyActiveOrders(userId: string, limit: number = 5) {
    const orders = await Order.find({ buyer: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      count: orders.length,
      orders: orders.map((o: any) => ({
        aspireOrderId: o.aspireOrderId,
        brandName: o.brandName,
        marketplace: o.marketplace || "Amazon",
        status: o.status,
        amount: o.amount,
        createdAt: o.createdAt ? formatDate(new Date(o.createdAt).toISOString()) : "N/A",
      })),
    };
  }

  private static async toolGetWalletSummary(userId: string) {
    try {
      const hubData = await ReferralService.getBuyerReferralHub(userId);
      return {
        walletId: hubData.wallet?.walletId || "WLT-AM",
        availableBalance: hubData.wallet?.availableBalance || 0,
        pendingBalance: hubData.wallet?.pendingBalance || 0,
        minWithdrawalThreshold: hubData.wallet?.minWithdrawalThreshold || 100,
        maxWalletCap: hubData.wallet?.maxWalletCap || 900,
        isEligibleForPayout: hubData.wallet?.isWithdrawalEligible || false,
        totalReferralEarned: hubData.stats?.totalEarned || 0,
        friendsInvited: (hubData.stats as any)?.totalReferred || 0,
        referralCode: hubData.referralCode || "",
      };
    } catch (e) {
      return {
        availableBalance: 0,
        pendingBalance: 0,
        minWithdrawalThreshold: 100,
        maxWalletCap: 900,
        isEligibleForPayout: false,
      };
    }
  }

  private static async toolFindDeals(query?: string, limit: number = 4) {
    const filter: any = { isActive: true, remainingSlots: { $gt: 0 } };
    if (query && query.trim()) {
      filter.$or = [
        { brandName: { $regex: query.trim(), $options: "i" } },
        { productDetails: { $regex: query.trim(), $options: "i" } },
        { marketplace: { $regex: query.trim(), $options: "i" } },
      ];
    }

    const deals = await ActiveDeal.find(filter)
      .sort({ remainingSlots: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return {
      count: deals.length,
      deals: deals.map((d: any) => ({
        dealId: d._id.toString(),
        brandName: d.brandName,
        productDetails: d.productDetails,
        productCode: d.productCode,
        marketplace: d.marketplace,
        remainingSlots: d.remainingSlots,
        productImage: d.productImage || null,
        dealType: d.dealType || "Original",
        actionUrl: `/app/activedeals`,
      })),
    };
  }

  private static async toolGenerateWhatsAppPitches(userId: string, userName: string, style?: string) {
    const hub = await ReferralService.getBuyerReferralHub(userId);
    const code = hub.referralCode || "AM-SHOPPER";
    const inviteUrl = `https://aspiremint.com/signup?ref=${code}`;

    const pitches = [
      {
        id: "college",
        title: "🎓 College & Gadgets Hack",
        tagline: "High conversion for friends & tech enthusiasts",
        text: `Bro, stop paying full price for electronics! 🎧🔥\n\nI'm getting 100% full cashback refunds on Amazon & Flipkart deals through AspireMint! (Got 100% back on my branded gear).\n\nUse my VIP invite link to join:\n👉 ${inviteUrl}\n(Or enter invite code: *${code}* at signup)\n\nComplete your first order and we both earn cash! 💰`,
        whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Bro, stop paying full price for electronics! 🎧🔥\n\nI'm getting 100% full cashback refunds on Amazon & Flipkart deals through AspireMint!\n\nUse my VIP invite link to join:\n👉 ${inviteUrl}\n(Invite code: *${code}*)\n\nClaim your first deal now! 💰`
        )}`,
      },
      {
        id: "deals",
        title: "🛍️ Festive 100% Cashback Deal",
        tagline: "Perfect for family and shopping groups",
        text: `Shopping on Amazon or Flipkart? Get 100% cashback refunds on top products! 🎁✨\n\nAspireMint lets verified buyers test top brands for FREE. Sign up with my link:\n👉 ${inviteUrl}\n\nInvite Code: *${code}*.\nStart claiming free deals today! 🛍️`,
        whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Shopping on Amazon or Flipkart? Get 100% cashback refunds on top products! 🎁✨\n\nAspireMint lets verified buyers test top brands for FREE. Sign up with my link:\n👉 ${inviteUrl}\n\nInvite Code: *${code}*`
        )}`,
      },
      {
        id: "hinglish",
        title: "🔥 Casual Hinglish Viral",
        tagline: "Natural, direct & super friendly",
        text: `Bhai Amazon pe 100% cashback refund mil raha hai genuine products pe! 💥\n\nMaine khud claim kiya hai. Tum bhi try karo. Join using my code *${code}*:\n👉 ${inviteUrl}\n\nFirst Amazon deal complete karo aur cashback seedha bank/UPI me lo! 💸`,
        whatsappUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Bhai Amazon pe 100% cashback refund mil raha hai genuine products pe! 💥\n\nJoin using my code *${code}*:\n👉 ${inviteUrl}\n\nClaim deals now! 💸`
        )}`,
      },
    ];

    return {
      referralCode: code,
      inviteUrl,
      pitches,
    };
  }
}
