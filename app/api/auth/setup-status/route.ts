import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const count = await User.countDocuments();
    return NextResponse.json({
      success: true,
      requiresSetup: count === 0
    });
  } catch (error: any) {
    console.error("GET Setup Status Error:", error);
    return NextResponse.json(
      { error: "Failed to determine database system configuration status." },
      { status: 500 }
    );
  }
}
