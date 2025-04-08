import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export async function createEmbedding(text: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "models/gemini-embedding-exp-03-07",
        content: {
          parts: [{ text }],
        },
        taskType: "SEMANTIC_SIMILARITY",
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate embedding");
  }

  const data = await response.json();
  const embedding = data.embedding?.values;
  if (!embedding) {
    throw new Error("Embedding not found in response");
  }

  console.log("🔢 Embedding length:", embedding.length);
  return JSON.stringify(embedding);
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
