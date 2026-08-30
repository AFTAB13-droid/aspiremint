import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import { User, IUser } from "@/modules/user/user.model";
import { checkRateLimit, storeOtp, getOtp, deleteOtp } from "@/services/otpService";
import { headers } from "next/headers";


import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isProfileComplete: boolean;
      totalCompletedOrders: number;
      mfaPending?: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    isProfileComplete: boolean;
    totalCompletedOrders: number;
    mfaPending?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isProfileComplete: boolean;
    totalCompletedOrders: number;
    mfaPending?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        webauthnToken: { label: "WebAuthn Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        await connectToDatabase();

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (credentials.webauthnToken) {
          // --- WebAuthn Passkey bypass validation ---
          const expectedOTP = `WEBAUTHN:${credentials.webauthnToken}`;
          if (
            user.resetPasswordOTP !== expectedOTP ||
            !user.resetPasswordExpires ||
            user.resetPasswordExpires < new Date()
          ) {
            throw new Error("Biometric session expired. Please scan again.");
          }

          // Consume the short-lived biometric bypass token
          user.resetPasswordOTP = undefined;
          user.resetPasswordExpires = undefined;
          await user.save();
        } else {
          // --- Standard password authorization ---
          if (!credentials.password) {
            throw new Error("Invalid credentials");
          }

          const lockKey = `login_lock:${normalizedEmail}`;
          const attemptsKey = `login_attempts:${normalizedEmail}`;

          const isLocked = await getOtp(lockKey);
          if (isLocked) {
            throw new Error("Account temporarily locked due to too many failed attempts. Try again in 15 minute(s).");
          }

          // @ts-ignore - comparePassword is added via Mongoose schema methods
          const isValid = await user.comparePassword(credentials.password);

          if (!isValid) {
            // Increment failed attempts and lock if threshold exceeded
            const { allowed } = await checkRateLimit(attemptsKey, 4, 900);
            if (!allowed) {
              await storeOtp(lockKey, "1", 900); // Lock for 15 minutes
              deleteOtp(attemptsKey).catch(() => {});
              throw new Error("Account temporarily locked due to too many failed attempts. Try again in 15 minute(s).");
            }
            throw new Error("Invalid credentials");
          }

          // Clear brute-force counters on success
          deleteOtp(attemptsKey).catch(() => {});
          deleteOtp(lockKey).catch(() => {});
        }

        if (!user.isActive) {
          throw new Error("Account is inactive");
        }

        if (user.role === "MEDIATOR" && user.isApproved === false) {
          throw new Error("Your registration is pending approval. Please check back later.");
        }

        const isMfaRequired = user.role === "ADMIN" || user.role === "SUBADMIN";
        let isMfaPending = false;

        if (isMfaRequired) {
          // Generate 6-digit OTP code using crypto
          const { randomInt } = await import("crypto");
          const mfaOtp = randomInt(100000, 999999).toString();

          // Save in fail-safe OTP service (Redis + MongoDB backup)
          const mfaRedisKey = `admin_mfa_otp:${user._id.toString()}`;
          storeOtp(mfaRedisKey, mfaOtp, 300).catch(() => {});

          // Send Email OTP!
          try {
            const { sendOTPEmail } = await import("@/services/emailService");
            await sendOTPEmail(user.email, user.name, mfaOtp).catch(mailError => {
              console.error("[MFA] Failed to send OTP email asynchronously:", mailError);
              console.log(`\n==================================================`);
              console.log(`[MFA FALLBACK] OTP Code for ${user.email}: ${mfaOtp}`);
              console.log(`==================================================\n`);
            });
            console.log(`[MFA] Dispatched OTP ${mfaOtp} to email ${user.email} asynchronously`);
          } catch (mailError) {
             console.error("[MFA] Could not dispatch email function:", mailError);
          }

          isMfaPending = true;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          isProfileComplete: user.isProfileComplete || false,
          totalCompletedOrders: user.totalCompletedOrders || 0,
          mfaPending: isMfaPending,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isProfileComplete = user.isProfileComplete;
        token.totalCompletedOrders = user.totalCompletedOrders;
        token.mfaPending = (user as any).mfaPending;
      }
      
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isProfileComplete = token.isProfileComplete as boolean;
        session.user.totalCompletedOrders = token.totalCompletedOrders as number;
        session.user.mfaPending = token.mfaPending as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user }) {
      if (user?.email) {
        try {
          let ip = "Client Authorized";
          let device = "Web Browser";
          
          try {
            const headersList = headers();
            const ua = headersList.get("user-agent");
            if (ua) device = ua;
            
            const forwardedFor = headersList.get("x-forwarded-for");
            if (forwardedFor) {
              ip = forwardedFor.split(",")[0].trim();
            } else {
              const realIp = headersList.get("x-real-ip");
              if (realIp) ip = realIp;
            }
          } catch (headerError) {
            console.warn("Could not read headers during login logging:", headerError);
          }

          connectToDatabase().then(() => {
            User.findOneAndUpdate(
              { email: user.email?.toLowerCase() },
              { 
                $push: { 
                  "securitySettings.loginHistory": {
                    $each: [{
                      ip: ip,
                      device: device,
                      location: "Unknown",
                      timestamp: new Date()
                    }],
                    $slice: -5
                  } 
                },
                $set: { lastLogin: new Date() }
              }
            ).catch(error => {
              console.error("Failed to log login history inside DB call:", error);
            });
          }).catch(dbError => {
            console.error("Failed to connect to DB for login history:", dbError);
          });
        } catch (error) {
          console.error("Failed to initiate login history logging:", error);
        }
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
