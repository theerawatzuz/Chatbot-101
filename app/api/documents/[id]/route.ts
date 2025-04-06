import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const connection = await connectDB();

    const [result] = await connection.execute(
      "DELETE FROM documents WHERE id = ?",
      [id]
    );

    await connection.end();

    const deletedRows = (result as any).affectedRows;
    if (deletedRows === 0) {
      return NextResponse.json(
        { error: "ไม่พบเอกสารที่ต้องการลบ" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบเอกสาร" },
      { status: 500 }
    );
  }
}
