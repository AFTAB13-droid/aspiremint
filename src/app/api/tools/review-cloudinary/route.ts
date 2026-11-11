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
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";

    if (!targetUrl && !imageDataUrl) {
      return NextResponse.json(
        { success: false, message: "A review permalink URL or screenshot image is required." },
        { status: 400 }
      );
    }

    let buffer: Buffer;

    // 1. If direct pre-rendered canvas screenshot is supplied, use it directly (0ms latency)
    if (imageDataUrl && imageDataUrl.startsWith("data:image/")) {
      const base64Data = imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // 2. Otherwise fetch screenshot bytes from internal in-house generator via POST
      const internalScreenshotUrl = new URL(
        "/api/tools/review-screenshot",
        req.url
      );

      const upstreamRes = await fetch(internalScreenshotUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: targetUrl,
          name: body.name,
          rating: body.rating,
          title: body.title,
          text: body.text,
          date: body.date,
          helpful: body.helpful,
          productTitle: body.productTitle,
          productImage: body.productImage,
          price: body.price,
          mrp: body.mrp,
          discount: body.discount,
          images: body.images,
        }),
      });

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
      buffer = Buffer.from(arrayBuffer);
    }

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
