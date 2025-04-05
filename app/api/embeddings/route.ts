import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyByxhX3HBfudEfV65R2phYohSjbhBy1FFg")

// Function to create embeddings using Google's embedding model
export async function createEmbedding(text: string) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" })
    const result = await embeddingModel.embedContent(text)
    const embedding = result.embedding.values
    return embedding
  } catch (error) {
    console.error("Error creating embedding:", error)
    throw error
  }
}

// API route handler
export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const embedding = await createEmbedding(text)

    return NextResponse.json({ embedding })
  } catch (error) {
    console.error("Error in embeddings API:", error)
    return NextResponse.json({ error: "Failed to create embedding" }, { status: 500 })
  }
}

