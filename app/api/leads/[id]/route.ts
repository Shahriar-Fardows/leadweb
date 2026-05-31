import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Lead } from "@/models/Lead";

// Update lead details
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { phone } = body;

    if (phone) {
      const duplicateLead = await Lead.findOne({ phone: phone.trim(), _id: { $ne: id } });
      if (duplicateLead) {
        return NextResponse.json(
          { error: "A client record with this Phone Number already exists." },
          { status: 400 }
        );
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error("PUT Lead API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update lead in database." },
      { status: 500 }
    );
  }
}

// Delete lead
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return NextResponse.json(
        { error: "Lead not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Lead successfully deleted." });
  } catch (error: any) {
    console.error("DELETE Lead API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete lead from database." },
      { status: 500 }
    );
  }
}
