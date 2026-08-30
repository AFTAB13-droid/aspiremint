import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { cookies } from "next/headers";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const host = request.headers.get("host") || "localhost";
    const rpID = host.split(":")[0];

    const options = await generateRegistrationOptions({
      rpName: "AspireMint",
      rpID,
      userID: user._id.toString(),
      userName: user.email,
      userDisplayName: user.name || user.email,
      // Exclude already registered credentials
      excludeCredentials: (user.webauthnCredentials || []).map((cred) => ({
        id: Buffer.from(cred.credentialID, "base64url"),
        type: "public-key",
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Save challenge in secure HttpOnly cookie
    const cookieStore = cookies();
    cookieStore.set("webauthn-registration-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return NextResponse.json({ success: true, data: options });
  } catch (error: any) {
    console.error("WebAuthn register option generation failed:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to generate registration options" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const cookieStore = cookies();
    const expectedChallenge = cookieStore.get("webauthn-registration-challenge")?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ success: false, message: "Registration challenge not found or expired" }, { status: 400 });
    }

    const host = request.headers.get("host") || "localhost";
    const rpID = host.split(":")[0];
    
    // Determine expectedOrigin dynamically
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const expectedOrigin = `${proto}://${host}`;

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      const transports = body.response?.transports || [];

      // Check if credentials array exists, if not initialize
      if (!user.webauthnCredentials) {
        user.webauthnCredentials = [];
      }

      // Convert Uint8Array credentialID and publicKey to base64url or string representation for persistence
      const credentialIDBase64 = Buffer.from(credentialID).toString("base64url");
      const publicKeyBase64 = Buffer.from(credentialPublicKey).toString("base64url");

      user.webauthnCredentials.push({
        credentialID: credentialIDBase64,
        publicKey: publicKeyBase64,
        counter: counter,
        transports: transports as any[],
      });

      await user.save();

      // Clear the registration challenge cookie
      cookieStore.delete("webauthn-registration-challenge");

      return NextResponse.json({ success: true, message: "Biometric login registered successfully!" });
    } else {
      return NextResponse.json({ success: false, message: "Verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("WebAuthn register verification failed:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to verify registration options" }, { status: 500 });
  }
}
