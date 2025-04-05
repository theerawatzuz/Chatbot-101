import { connectDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // รอให้ params พร้อมใช้งาน
    const id = await Promise.resolve(params.id);

    const connection = await connectDB();

    // ลบเอกสารจากฐานข้อมูล
    const [result] = await connection.execute(
      "DELETE FROM documents WHERE id = ?",
      [id]
    );

    await connection.end();

    // ตรวจสอบว่ามีการลบข้อมูลจริงหรือไม่
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
