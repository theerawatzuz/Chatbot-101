import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyByxhX3HBfudEfV65R2phYohSjbhBy1FFg");

export async function createEmbedding(text: string) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent(text);
    let embedding = result.embedding.values;

    // ปรับขนาด vector ให้เป็น 1024 มิติ
    if (embedding.length < 1024) {
      embedding = embedding.concat(new Array(1024 - embedding.length).fill(0));
    } else if (embedding.length > 1024) {
      embedding = embedding.slice(0, 1024);
    }

    console.log("Vector size:", embedding.length); // debug

    return JSON.stringify(embedding);
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}
