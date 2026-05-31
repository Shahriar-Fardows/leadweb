import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";

// Fetch all leads
export async function GET() {
  try {
    await connectToDatabase();
    const leads = await Lead.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error("GET Leads API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads from database." },
      { status: 500 }
    );
  }
}

// Create a new custom lead
export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { guardianName, studentName, studentAge, studentClass, phone, email, address, webinar, firstCall, secondCall, thirdCall, fourthCall, callLogs, status } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Client Phone Number is required." },
        { status: 400 }
      );
    }

    // Check duplicate client by phone number
    const existingLead = await Lead.findOne({ phone: phone.trim() });
    if (existingLead) {
      return NextResponse.json(
        { error: "A client record with this Phone Number already exists." },
        { status: 400 }
      );
    }

    const newLead = await Lead.create({
      guardianName: guardianName || "N/A",
      studentName: studentName || "N/A",
      studentAge: studentAge || "",
      studentClass: studentClass || "",
      phone: phone.trim(),
      email: email || "",
      address: address || "N/A",
      webinar: webinar || "",
      firstCall: firstCall || "",
      secondCall: secondCall || "",
      thirdCall: thirdCall || "",
      fourthCall: fourthCall || "",
      callLogs: callLogs || [],
      status: status || "New"
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error: any) {
    console.error("POST Leads API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save lead to database." },
      { status: 500 }
    );
  }
}
