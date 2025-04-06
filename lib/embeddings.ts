import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function createEmbedding(text: string) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await embeddingModel.embedContent(text);
    let embedding = result.embedding.values;

    if (embedding.length !== 1024) {
      const normalizedEmbedding = new Array(1024).fill(0);

      const step = embedding.length / 1024;
      for (let i = 0; i < 1024; i++) {
        const sourceIdx = Math.floor(i * step);
        normalizedEmbedding[i] = embedding[sourceIdx];
      }

      embedding = normalizedEmbedding;
    }

    return JSON.stringify(embedding);
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

export const getEmbedding = async (text: string) => {
  const response = await fetch("/api/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error("Failed to get embedding");
  }

  const data = await response.json();
  return data.embedding;
};
