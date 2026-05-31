import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { User, UserRole } from "@/modules/user/user.model";
import connectToDatabase from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "SUBADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden. Admin or SubAdmin access required." },
        { status: 403 }
      );
    }

    const { name, email, mobile, password, role } = await req.json();

    if (!name || !email || !mobile || !password || !role) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (role !== "SUBADMIN" && role !== "MEDIATOR") {
      return NextResponse.json(
        { success: false, message: "Invalid role specified" },
        { status: 400 }
      );
    }

    if (userRole === "SUBADMIN" && role === "SUBADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden. SubAdmin cannot create other SubAdmin accounts." },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { mobile }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email or mobile already exists" },
        { status: 409 }
      );
    }

    // Generate AspireMint ID based on Role
    const prefix = role === "SUBADMIN" ? "SAD-" : "MED-";
    const aspireMintId = prefix + Math.random().toString(36).substr(2, 6).toUpperCase();
    const referralId = Math.random().toString(36).substr(2, 6).toUpperCase();

    // The user model pre-save hook will hash the password, 
    // but just to be safe if it's bypassed, we can hash it here or let the model do it.
    // user.model.ts has: UserSchema.pre("save", ...) so we just pass plain text password.

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      mobile,
      password, // Pre-save hook hashes this
      role: role as UserRole,
      aspireMintId,
      referralId,
      isEmailVerified: true, // Auto-verified since Admin created it
      isKycVerified: true,
      isProfileComplete: true,
      isActive: true,
      isApproved: true,
    });

    await newUser.save();

    return NextResponse.json(
      { 
        success: true, 
        message: `${role} account created successfully`,
        data: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          aspireMintId: newUser.aspireMintId
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Staff Creation Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
