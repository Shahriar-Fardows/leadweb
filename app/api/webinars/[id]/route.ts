import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Webinar } from "@/models/Webinar";
import { Lead } from "@/models/Lead";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const webinar = await Webinar.findById(id);
    if (!webinar) {
      return NextResponse.json(
        { error: "Webinar option not found." },
        { status: 404 }
      );
    }

    // Check if any leads are currently assigned to this webinar
    const leadsCount = await Lead.countDocuments({
      webinar: { $regex: new RegExp(`^${webinar.name.trim()}$`, "i") }
    });

    if (leadsCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete webinar. There are ${leadsCount} lead record(s) currently assigned to "${webinar.name}".` },
        { status: 400 }
      );
    }

    await Webinar.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Webinar deleted successfully." });
  } catch (error: any) {
    console.error("DELETE Webinar API Error:", error);
    return NextResponse.json(
      { error: "Failed to delete webinar from database." },
      { status: 500 }
    );
  }
}
