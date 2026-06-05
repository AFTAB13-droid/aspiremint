import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/db";
import { User, IUser } from "@/modules/user/user.model";
import redis from "@/lib/redis";
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // --- BRUTE-FORCE PROTECTION ---
        // Lock account for 15 minutes after 5 failed attempts
        const lockKey = `login_lock:${normalizedEmail}`;
        const attemptsKey = `login_attempts:${normalizedEmail}`;

        const isLocked = await redis.get(lockKey);
        if (isLocked) {
          const ttl = await redis.ttl(lockKey);
          const waitMins = Math.ceil(ttl / 60);
          throw new Error(`Account temporarily locked due to too many failed attempts. Try again in ${waitMins} minute(s).`);
        }
        // --------------------------------

        await connectToDatabase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          // Increment failed attempts even for non-existent emails (prevent enumeration)
          const attempts = await redis.incr(attemptsKey);
          if (attempts === 1) await redis.expire(attemptsKey, 900);
          throw new Error("Invalid credentials");
        }

        // @ts-ignore - comparePassword is added via Mongoose schema methods
        const isValid = await user.comparePassword(credentials.password);

        if (!isValid) {
          // Increment failed attempts and lock if threshold exceeded
          const attempts = await redis.incr(attemptsKey);
          if (attempts === 1) await redis.expire(attemptsKey, 900); // 15-min window
          if (attempts >= 5) {
            await redis.set(lockKey, "1", { ex: 900 }); // Lock for 15 minutes
            await redis.del(attemptsKey);
            throw new Error("Account temporarily locked due to too many failed attempts. Try again in 15 minute(s).");
          }
          throw new Error("Invalid credentials");
        }

        // --- Login success: clear brute-force counters ---
        redis.del(attemptsKey).catch(() => {});
        redis.del(lockKey).catch(() => {});
        // -------------------------------------------------

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

          // Save in Redis for 5 minutes
          const mfaRedisKey = `admin_mfa_otp:${user._id.toString()}`;
          redis.set(mfaRedisKey, mfaOtp, { ex: 300 }).catch(() => {});

          // Send Email OTP!
          try {
            const { sendOTPEmail } = await import("@/services/emailService");
            sendOTPEmail(user.email, user.name, mfaOtp).catch(mailError => {
              console.error("[MFA] Failed to send OTP email asynchronously:", mailError);
              console.log(`\n==================================================`);
              console.log(`[MFA FALLBACK] OTP Code for ${user.email}: ${mfaOtp}`);
              console.log(`==================================================\n`);
            });
            console.log(`[MFA] Sent OTP ${mfaOtp} to email ${user.email} asynchronously`);
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

          await connectToDatabase();
          await User.findOneAndUpdate(
            { email: user.email.toLowerCase() },
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
          );
        } catch (error) {
          console.error("Failed to log login history:", error);
        }
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};
