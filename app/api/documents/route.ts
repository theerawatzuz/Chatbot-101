import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const connection = await connectDB();

    // ดึงข้อมูลแบบมี pagination
    const [documents] = await connection.execute(
      `SELECT id, document as text, created_at as timestamp 
       FROM documents 
       ORDER BY created_at DESC 
       LIMIT ${limit} OFFSET ${offset}`
    );

    // ดึงวันที่ล่าสุด
    const [latestDate] = await connection.execute(
      "SELECT MAX(created_at) as latest_date FROM documents"
    );

    await connection.end();

    return NextResponse.json({
      documents,
      latestDate: (latestDate as any)[0]?.latest_date || new Date(),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
