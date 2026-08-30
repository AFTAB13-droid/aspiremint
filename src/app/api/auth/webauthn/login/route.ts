import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User } from "@/modules/user/user.model";
import { cookies } from "next/headers";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const email = request.nextUrl.searchParams.get("email");
    
    let allowCredentials: any[] = [];
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user && user.webauthnCredentials) {
        allowCredentials = user.webauthnCredentials.map((cred) => ({
          id: cred.credentialID,
          type: "public-key" as const,
          transports: cred.transports as any[],
        }));
      }
    }

    const host = request.headers.get("host") || "localhost";
    const rpID = host.split(":")[0];

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: "preferred",
    });

    // Store challenge in cookie
    const cookieStore = cookies();
    cookieStore.set("webauthn-authentication-challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return NextResponse.json({ success: true, data: options });
  } catch (error: any) {
    console.error("WebAuthn login options generation failed:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to generate authentication options" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json(); // Biometric login assertion response
    const cookieStore = cookies();
    const expectedChallenge = cookieStore.get("webauthn-authentication-challenge")?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ success: false, message: "Authentication challenge not found or expired" }, { status: 400 });
    }

    // Find user that has this credential ID registered
    const credentialID = body.id;
    const user = await User.findOne({ "webauthnCredentials.credentialID": credentialID });
    if (!user) {
      return NextResponse.json({ success: false, message: "No registered device found for this credential" }, { status: 404 });
    }

    const dbCredential = user.webauthnCredentials?.find(
      (cred) => cred.credentialID === credentialID
    );
    if (!dbCredential) {
      return NextResponse.json({ success: false, message: "Credential mismatch" }, { status: 400 });
    }

    const host = request.headers.get("host") || "localhost";
    const rpID = host.split(":")[0];
    
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const expectedOrigin = `${proto}://${host}`;

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(dbCredential.credentialID, "base64url"),
        credentialPublicKey: Buffer.from(dbCredential.publicKey, "base64url"),
        counter: dbCredential.counter,
        transports: dbCredential.transports as any[],
      },
    });

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo;
      
      // Update database counter
      dbCredential.counter = newCounter;
      await user.save();

      // Clear challenge cookie
      cookieStore.delete("webauthn-authentication-challenge");

      // Generate temporary login token
      const loginToken = crypto.randomBytes(32).toString("hex");

      // Store in resetPasswordOTP as temporary bypass
      user.resetPasswordOTP = `WEBAUTHN:${loginToken}`;
      user.resetPasswordExpires = new Date(Date.now() + 60000); // 1 minute expiry
      await user.save();

      return NextResponse.json({
        success: true,
        token: loginToken,
        email: user.email,
      });
    } else {
      return NextResponse.json({ success: false, message: "Biometric signature validation failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("WebAuthn login verification failed:", error);
    return NextResponse.json({ success: false, message: error.message || "Authentication failed" }, { status: 500 });
  }
}
