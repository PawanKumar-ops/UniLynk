export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";

export async function DELETE(req, context) {
  try {
    await connectDB();

    const { id } = await context.params;

    console.log("DELETE ID:", id);
    console.log("DB:", Form.db.name);
    console.log("COLLECTION:", Form.collection.name);

    const deleted = await Form.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Form deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
