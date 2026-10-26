import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetUrl = (body.url || "").trim();
    const orderId = (body.orderId || "").trim();

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, message: "A review permalink URL is required." },
        { status: 400 }
      );
    }

    // 1. Fetch screenshot bytes from upstream rikome service
    const upstreamUrl = `https://rikome.com/api/review-screenshot?url=${encodeURIComponent(targetUrl)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          message: errText || `Failed to retrieve screenshot from upstream (HTTP ${upstreamRes.status})`,
        },
        { status: upstreamRes.status || 500 }
      );
    }

    const arrayBuffer = await upstreamRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload buffer directly to Cloudinary into 'aspiremint_orders' folder
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, "");
    const publicId = `flipkart_review_${cleanOrderId ? `${cleanOrderId}_` : ""}${Date.now()}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "aspiremint_orders",
          resource_type: "image",
          format: "png",
          public_id: publicId,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    if (!uploadResult?.secure_url) {
      throw new Error("Cloudinary did not return a secure URL");
    }

    return NextResponse.json({
      success: true,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });
  } catch (error: any) {
    console.error("Cloudinary review screenshot upload error:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to upload review screenshot to Cloudinary" },
      { status: 500 }
    );
  }
}
