import { generateResponse } from "@/lib/gemini-api";

export async function POST(request: Request) {
  try {
    const { message, apiKey, mode } = await request.json();

    // Generate response using Gemini API directly
    const responseText = await generateResponse(message, apiKey, mode);

    return new Response(
      JSON.stringify({
        content: responseText,
        createdAt: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
