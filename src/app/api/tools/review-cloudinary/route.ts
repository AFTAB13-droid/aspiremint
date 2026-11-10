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

    // 1. Fetch screenshot bytes from internal in-house generator
    const internalScreenshotUrl = new URL(
      "/api/tools/review-screenshot",
      req.url
    );
    internalScreenshotUrl.searchParams.set("url", targetUrl);
    if (body.name) internalScreenshotUrl.searchParams.set("name", body.name);
    if (body.rating) internalScreenshotUrl.searchParams.set("rating", String(body.rating));
    if (body.title) internalScreenshotUrl.searchParams.set("title", body.title);
    if (body.text) internalScreenshotUrl.searchParams.set("text", body.text);
    if (body.date) internalScreenshotUrl.searchParams.set("date", body.date);
    if (body.attributes) internalScreenshotUrl.searchParams.set("attributes", body.attributes);

    const upstreamRes = await fetch(internalScreenshotUrl.toString());

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          message: errText || `Failed to generate review proof screenshot (HTTP ${upstreamRes.status})`,
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
