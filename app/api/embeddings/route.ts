import { NextResponse } from "next/server";
import { createEmbedding } from "@/lib/embeddings";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const embedding = await createEmbedding(text);

    return NextResponse.json({ embedding });
  } catch (error) {
    console.error("Error in embeddings API:", error);
    return NextResponse.json(
      { error: "Failed to create embedding" },
      { status: 500 }
    );
  }
}
