import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { User, UserRole } from "@/modules/user/user.model";
import { getOtp, deleteOtp } from "@/services/otpService";
import { sendWelcomeEmail } from "@/services/emailService";

// Define the shape of our expected request body
interface SignupRequestBody {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
  otp: string;
}

export async function POST(req: Request) {
  try {
    const body: SignupRequestBody = await req.json();
    const { name, email, mobile, password, role, otp } = body;

    // 1. Validate required fields
    if (!name || !email || !mobile || !password || !role || !otp) {
      return NextResponse.json(
        { success: false, message: "All fields including OTP are required" },
        { status: 400 }
      );
    }

    // Validate password meets strict criteria: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character" 
        },
        { status: 400 }
      );
    }

    // 2. Validate role matches our system roles (Buyer or Mediator during signup, not Admin)
    const normalizedRole = role.toUpperCase();
    if (normalizedRole !== UserRole.USER && normalizedRole !== UserRole.MEDIATOR) {
       return Response.json(
        { success: false, message: "Invalid role selected" },
        { status: 400 }
      );
    }

    // 3. Connect to DB
    await connectToDatabase();

    // 4. Check if user exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { mobile: mobile }
      ]
    });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email or Mobile is already registered" },
        { status: 400 }
      );
    }

    // 5. Verify OTP from Fail-Safe Service (Redis + MongoDB fallback)
    const normalizedEmail = email.trim().toLowerCase();
    const storedOtp = await getOtp(`signup_otp:${normalizedEmail}`);
    
    if (!storedOtp || String(storedOtp) !== String(otp).trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }
 
    // Delete OTP after successful verification
    deleteOtp(`signup_otp:${normalizedEmail}`).catch(() => {});

    // 6. Create user (password will be hashed automatically by our Mongoose pre-save hook)
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      mobile,
      password,
      role: normalizedRole,
      isApproved: normalizedRole !== UserRole.MEDIATOR, // Mediators require admin approval
    });

    await newUser.save();

    // 7. Send Welcome Email asynchronously
    sendWelcomeEmail(newUser.email, newUser.name).catch((emailError) => {
      console.error("Failed to send welcome email:", emailError);
    });

    // 8. Return success
    return NextResponse.json(
      { 
        success: true, 
        message: "Account created successfully",
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
    console.error("Signup Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong during signup. Please try again." },
      { status: 500 }
    );
  }
}
