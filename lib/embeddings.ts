import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY_1 || "",
  process.env.GEMINI_API_KEY_2 || "",
  process.env.GEMINI_API_KEY_3 || "",
];

let currentKeyIndex = 0;

const rotateApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return API_KEYS[currentKeyIndex];
};

export async function createEmbedding(
  text: string,
  retryCount = 0
): Promise<string> {
  const maxRetries = API_KEYS.length - 1;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${API_KEYS[currentKeyIndex]}`,
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
      const errText = await response.text();
      console.error("❌ Gemini error:", response.status, errText);

      // ถ้าเป็น error 429 (quota exhausted) และยังมี API keys เหลือ
      if (response.status === 429 && retryCount < maxRetries) {
        console.log(
          `🔄 Switching to next API key (${
            retryCount + 1
          }/${maxRetries} retries)`
        );
        rotateApiKey();
        // ลองใหม่ด้วย API key ถัดไป
        return createEmbedding(text, retryCount + 1);
      }

      throw new Error("Failed to generate embedding");
    }

    const data = await response.json();
    const embedding = data.embedding?.values;
    if (!embedding) {
      throw new Error("Embedding not found in response");
    }

    console.log("🔢 Embedding length:", embedding.length);
    return JSON.stringify(embedding);
  } catch (error) {
    if (error instanceof Error && retryCount < maxRetries) {
      console.log(
        `🔄 Retrying with next API key (${
          retryCount + 1
        }/${maxRetries} retries)`
      );
      rotateApiKey();
      return createEmbedding(text, retryCount + 1);
    }
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
