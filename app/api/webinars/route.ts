import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Webinar } from "@/models/Webinar";

export async function GET() {
  try {
    await connectToDatabase();
    const webinars = await Webinar.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, webinars });
  } catch (error: any) {
    console.error("GET Webinars API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch webinars from database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Webinar name is required." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const existing = await Webinar.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, "i") } });
    if (existing) {
      return NextResponse.json(
        { error: "A webinar with this name already exists." },
        { status: 400 }
      );
    }

    const newWebinar = await Webinar.create({ name: trimmedName });
    return NextResponse.json({ success: true, webinar: newWebinar });
  } catch (error: any) {
    console.error("POST Webinars API Error:", error);
    return NextResponse.json(
      { error: "Failed to save webinar to database." },
      { status: 500 }
    );
  }
}
