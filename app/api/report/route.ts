import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";
import { Webinar } from "@/models/Webinar";

export async function GET() {
  try {
    await connectToDatabase();
    const [leads, webinars] = await Promise.all([
      Lead.find({}).sort({ createdAt: -1 }).lean(),
      Webinar.find({}).sort({ createdAt: -1 }).lean(),
    ]);
    return NextResponse.json({ success: true, leads, webinars });
  } catch (error: any) {
    console.error("GET Report API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch report data." },
      { status: 500 }
    );
  }
}
