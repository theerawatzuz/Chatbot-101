import { NextResponse } from "next/server"
import { generateResponse } from "@/lib/gemini-api"

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json()

    // Get the last user message
    const lastUserMessage = messages.findLast((m: any) => m.role === "user")?.content || ""

    // Generate response using Gemini API directly
    const responseText = await generateResponse(lastUserMessage, apiKey)

    // Return the response
    return NextResponse.json({
      role: "assistant",
      content: responseText,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        role: "assistant",
        content: "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ 🙏",
        createdAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}

