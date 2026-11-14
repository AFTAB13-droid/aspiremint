import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import OpenAI from "openai";
import { Order, OrderStatus } from "@/modules/order/order.model";
import { ActiveDeal } from "@/modules/brand/deal.model";
import { User } from "@/modules/user/user.model";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session?.user?.id || (role !== "ADMIN" && role !== "SUBADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, message: "Valid messages array required." }, { status: 400 });
    }

    await connectToDatabase();

    const now = new Date();
    const currentDateFormatted = now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });

    const adminTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: "function",
        function: {
          name: "get_financial_liabilities",
          description: "Calculate real-time refund payout liabilities grouped by brand for all pending and approved orders waiting for payout.",
          parameters: {
            type: "object",
            properties: {
              brandName: { type: "string", description: "Optional specific brand filter (e.g. 'boAt', 'Noise')." },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "scan_fraud_and_duplicates",
          description: "Scan for duplicate marketplace Order IDs used across multiple buyer accounts, or suspicious high-rejection buyers.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Max suspicious cases to retrieve (default 10)." },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_mediator_workload",
          description: "Inspect mediator active workloads, pending orders to verify, and payout turnaround stats.",
          parameters: {
            type: "object",
            properties: {
              mediatorName: { type: "string", description: "Optional mediator name to filter." },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_deal_slot_analytics",
          description: "Inspect active campaign deal slots, capacity occupancy, and identify deals running out of slots.",
          parameters: {
            type: "object",
            properties: {
              marketplace: { type: "string", description: "Optional filter: 'Amazon' or 'Flipkart'." },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "admin_order_deep_inspect",
          description: "Inspect comprehensive audit trail, screenshots, buyer contact, and payment details for a specific Order ID.",
          parameters: {
            type: "object",
            properties: {
              orderId: { type: "string", description: "The marketplace Order ID (e.g. 403-1234567) or Ref ID." },
            },
            required: ["orderId"],
          },
        },
      },
    ];

    const adminSystemPrompt = `You are Sana Admin Copilot, the executive AI operations and business intelligence partner for AspireMint administrators.
CURRENT REAL-TIME DATE: ${currentDateFormatted} (IST, Asia/Kolkata)

YOUR ROLE & SUPERPOWERS:
- You assist Admins with financial liability calculations, fraud/duplicate detection, mediator workloads, deal slot inventory, and order disputes.
- Tone: Professional, analytical, proactive, crisp, and executive-level.
- Always provide actionable summaries with bold numbers, bullet points, and exact rupee figures (₹).
- When asked about liabilities, fraud, mediators, deals, or order lookups, ALWAYS trigger the appropriate admin tools to fetch authentic live database data.
- Format numbers in Indian numbering format (e.g. ₹1,45,200).`;

    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: adminSystemPrompt },
      ...messages.slice(-8).map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const cards: any[] = [];

    // 1. First completion call
    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      user: session.user.id,
      messages: apiMessages,
      tools: adminTools,
      tool_choice: "auto",
      temperature: 0.5,
      max_tokens: 650,
    });

    let assistantMessage = completion.choices[0]?.message;

    // 2. Handle admin tool calls
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      apiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const functionName = toolCall.function.name;
        let functionArgs: any = {};
        try {
          functionArgs = JSON.parse(toolCall.function.arguments);
        } catch {}

        let functionResult: any = {};

        if (functionName === "get_financial_liabilities") {
          const matchStage: any = {
            status: {
              $in: [
                OrderStatus.REFUND_APPROVED,
                OrderStatus.REFUND_FORM_SUBMITTED,
                OrderStatus.UNDER_VERIFICATION,
                OrderStatus.REFUND_PROCESSING,
              ],
            },
          };
          if (functionArgs.brandName) {
            matchStage.brandName = { $regex: new RegExp(functionArgs.brandName, "i") };
          }

          const agg = await Order.aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: "$brandName",
                count: { $sum: 1 },
                totalAmount: {
                  $sum: { $add: ["$amount", { $ifNull: ["$lessAmount", 0] }] },
                },
              },
            },
            { $sort: { totalAmount: -1 } },
          ]);

          const totalLiability = agg.reduce((acc, curr) => acc + curr.totalAmount, 0);
          const totalOrders = agg.reduce((acc, curr) => acc + curr.count, 0);

          functionResult = {
            totalLiability,
            totalOrders,
            brandBreakdown: agg.slice(0, 10),
          };

          cards.push({
            type: "ADMIN_LIABILITY_CARD",
            data: functionResult,
          });
        } else if (functionName === "scan_fraud_and_duplicates") {
          const duplicates = await Order.aggregate([
            { $match: { userOrderId: { $exists: true, $ne: "" } } },
            {
              $group: {
                _id: "$userOrderId",
                count: { $sum: 1 },
                buyers: { $addToSet: "$buyer" },
                brands: { $addToSet: "$brandName" },
                statuses: { $addToSet: "$status" },
              },
            },
            { $match: { count: { $gt: 1 } } },
            { $limit: functionArgs.limit || 8 },
          ]);

          functionResult = {
            duplicateCount: duplicates.length,
            duplicates: duplicates.map((d) => ({
              orderId: d._id,
              count: d.count,
              uniqueBuyers: d.buyers.length,
              brands: d.brands,
              statuses: d.statuses,
            })),
          };

          cards.push({
            type: "ADMIN_FRAUD_ALERT_CARD",
            data: functionResult,
          });
        } else if (functionName === "get_mediator_workload") {
          const workload = await Order.aggregate([
            {
              $match: {
                status: {
                  $in: [
                    OrderStatus.REFUND_FORM_SUBMITTED,
                    OrderStatus.UNDER_VERIFICATION,
                    OrderStatus.REFUND_APPROVED,
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$mediator",
                pendingVerification: {
                  $sum: {
                    $cond: [
                      { $in: ["$status", [OrderStatus.REFUND_FORM_SUBMITTED, OrderStatus.UNDER_VERIFICATION]] },
                      1,
                      0,
                    ],
                  },
                },
                approvedWaitingPayout: {
                  $sum: {
                    $cond: [{ $eq: ["$status", OrderStatus.REFUND_APPROVED] }, 1, 0],
                  },
                },
                totalPending: { $sum: 1 },
              },
            },
            { $sort: { totalPending: -1 } },
          ]);

          // Populate mediator names
          const populated = await Promise.all(
            workload.map(async (w) => {
              const u = await User.findById(w._id).select("name email").lean();
              return {
                mediatorId: w._id,
                name: u?.name || "Unassigned / System",
                email: u?.email || "N/A",
                pendingVerification: w.pendingVerification,
                approvedWaitingPayout: w.approvedWaitingPayout,
                totalPending: w.totalPending,
              };
            })
          );

          functionResult = { mediators: populated };
          cards.push({
            type: "ADMIN_MEDIATOR_CARD",
            data: functionResult,
          });
        } else if (functionName === "get_deal_slot_analytics") {
          const deals = await ActiveDeal.find({ isActive: true })
            .select("productName brandName currentSlot totalSlots dealType productPrice")
            .sort({ currentSlot: -1 })
            .limit(10)
            .lean();

          functionResult = {
            totalActiveDeals: await ActiveDeal.countDocuments({ isActive: true }),
            topDeals: deals.map((d: any) => ({
              id: d._id,
              title: d.productName,
              brand: d.brandName,
              slotsUsed: d.currentSlot,
              totalSlots: d.totalSlots,
              percentFilled: d.totalSlots > 0 ? Math.round((d.currentSlot / d.totalSlots) * 100) : 0,
              price: d.productPrice,
            })),
          };

          cards.push({
            type: "ADMIN_DEAL_CARD",
            data: functionResult,
          });
        } else if (functionName === "admin_order_deep_inspect") {
          const cleanId = (functionArgs.orderId || "").trim();
          const order = await Order.findOne({
            $or: [
              { userOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
              { aspireOrderId: { $regex: new RegExp(`^${cleanId}$`, "i") } },
              ...(cleanId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: cleanId }] : []),
            ],
          })
            .populate("buyer", "name email phone aspireMintId")
            .populate("mediator", "name email")
            .lean();

          if (order) {
            functionResult = {
              found: true,
              order: {
                id: (order as any)._id,
                userOrderId: order.userOrderId || "N/A",
                refId: order.aspireOrderId,
                brand: order.brandName,
                productCode: order.productCode,
                amount: order.amount,
                expectedRefund: order.refundDetails?.expectedPayout || (order.amount + (order.lessAmount || 0)),
                status: order.status,
                buyerName: (order as any).buyer?.name || "N/A",
                buyerEmail: (order as any).buyer?.email || "N/A",
                buyerId: (order as any).buyer?.aspireMintId || "N/A",
                mediatorName: (order as any).mediator?.name || (order as any).mediatorName || "Unassigned",
                payerName: (order as any).paymentDetails?.paidByName || "Not paid yet",
                utr: (order as any).paymentDetails?.transactionId || "N/A",
                orderPlacedAt: (order as any).createdAt || null,
                refundFormSubmittedAt: (order.status !== OrderStatus.REFUND_FORM_PENDING && order.refundDetails?.submittedAt) ? order.refundDetails.submittedAt : null,
                submittedAt: (order.status !== OrderStatus.REFUND_FORM_PENDING && order.refundDetails?.submittedAt) ? order.refundDetails.submittedAt : null,
                orderScreenshot: order.screenshot || null,
                reviewScreenshot: order.refundProof?.reviewScreenshot || null,
                deliveryScreenshot: order.refundProof?.deliveryScreenshot || null,
                returnScreenshot: order.refundProof?.returnPeriodScreenshot || null,
                rejectionNote: order.refundDetails?.rejectionNote || null,
              },
            };

            cards.push({
              type: "ADMIN_ORDER_INSPECT_CARD",
              data: functionResult.order,
            });
          } else {
            functionResult = { found: false, message: `No order found for ID: ${cleanId}` };
          }
        }

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      // Second completion
      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        user: session.user.id,
        messages: apiMessages,
        temperature: 0.5,
        max_tokens: 650,
      });

      assistantMessage = completion.choices[0]?.message;
    }

    const reply = assistantMessage?.content || "Admin analysis complete.";

    return NextResponse.json({
      success: true,
      data: {
        reply,
        cards: cards.length > 0 ? cards : undefined,
      },
    });
  } catch (error: any) {
    console.error("Admin Sana Chat Error:", error);
    return NextResponse.json({ success: false, message: error?.message || "Failed to process admin chat" }, { status: 500 });
  }
}
