import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      users
    });
  } catch (error: any) {
    console.error("GET Users API Error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred while retrieving user list." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 400 }
      );
    }

    // Assign 'Super Admin' to the first user registered in the system, and 'User' to subsequent users
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? "Super Admin" : "User";

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password, // Stored securely
      role: assignedRole
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
