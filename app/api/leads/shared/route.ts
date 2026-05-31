import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const webinar = searchParams.get("webinar");

    if (!webinar) {
      return NextResponse.json(
        { error: "Webinar parameter is required." },
        { status: 400 }
      );
    }

    // Query leads for this specific webinar
    const leads = await Lead.find({ 
      webinar: { $regex: new RegExp(`^${webinar.trim()}$`, "i") } 
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("GET Shared Leads API Error:", error);
    return NextResponse.json(
      { error: "Failed to query shared webinar leads." },
      { status: 500 }
    );
  }
}
