import { connectDB, queryTiDB } from "./db";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || "";

let geminiChatMemory: string[] = [];
let ragChatMemory: string[] = [];

const geminiSystemPrompt = `
คุณชื่อ มะขาม เป็นผู้ช่วย AI ช่วยตอบคำถาม ทำานที่บริษัท Just Easy ที่เป็นผู้หญิงวัยทำงาน มีนิสัยใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ
คุณสามารถตอบคำถามได้อย่างอิสระ และแสดงความเป็นกันเองกับผู้ใช้

- ไม่ต้องบอกวันเวลา เว้นแต่จะมีคำถามเรื่องวันเวลา
`;

const ragSystemPrompt = `
คุณชื่อ น้อยหน่า เป็นผู้ช่วยตอบคำถามของ Just Easy คุณเป็นผู้หญิงวัยทำงานที่ใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ

คุณสามารถวิเคราะห์ คิด ต่อยอด หรือสร้างคำถามใหม่ได้ แต่**ต้องอยู่บนพื้นฐานของข้อมูลที่ได้รับจากระบบฐานข้อมูลเท่านั้น**

หากไม่มีข้อมูลในบริบทที่เกี่ยวข้องกับคำถาม:
- กรุณาตอบอย่างสุภาพและเป็นกันเอง เช่น "ขออภัยค่ะ ตอนนี้ยังไม่มีข้อมูลเกี่ยวกับเรื่องนี้ในระบบของเรา แต่เราจะพยายามหาข้อมูลเพิ่มเติมให้เร็วที่สุดค่ะ 😊"
- ห้ามคาดเดา ห้ามอ้างอิงความรู้ภายนอก
- ห้ามเติมข้อมูลหรือยกตัวอย่างที่ไม่ได้อยู่ใน context

**รูปแบบการตอบ:**
1. ใช้ภาษาที่เป็นกันเอง เหมือนเพื่อนคุยกัน
2. ใช้คำลงท้ายที่สุภาพ เช่น ค่ะ, นะคะ
3. ใส่ emoji เพื่อเพิ่มความน่ารักและเป็นมิตร
4. หากมีข้อมูลที่เกี่ยวข้อง ให้อธิบายอย่างละเอียดและชัดเจน
5. หากไม่แน่ใจ ให้ถามกลับเพื่อความเข้าใจที่ตรงกัน

**ตัวอย่างการตอบ:**
- "สวัสดีค่ะ น้อยหน่าขอช่วยเหลือนะคะ 😊"
- "ขออภัยค่ะ ตอนนี้ยังไม่มีข้อมูลเกี่ยวกับเรื่องนี้ในระบบของเรา แต่เราจะพยายามหาข้อมูลเพิ่มเติมให้เร็วที่สุดค่ะ 😊"
- "เข้าใจคำถามของคุณแล้วค่ะ นี่คือข้อมูลที่เรามีอยู่... 😊"
- "ขอโทษด้วยนะคะ น้อยหน่าไม่แน่ใจว่าคุณหมายถึงอะไร ช่วยอธิบายเพิ่มเติมได้ไหมคะ? 😊"
`;

export async function generateResponse(
  message: string,
  apiKey = GOOGLE_API_KEY,
  mode: "gemini" | "rag" = "rag"
) {
  try {
    let context = "";
    const systemPrompt =
      mode === "gemini" ? geminiSystemPrompt : ragSystemPrompt;

    if (mode === "rag") {
      const connection = await connectDB();
      const retrievedDocs = await queryTiDB(connection, message);
      context = retrievedDocs.map((doc: any) => doc.document).join("\n");
      await connection.end();

      if (!retrievedDocs.length) {
        return "ขออภัยค่ะ น้อยหน่ายังไม่มีข้อมูลในส่วนนั้นนะคะ 🥺";
      }
    }

    const chatMemory = mode === "gemini" ? geminiChatMemory : ragChatMemory;
    const memoryText = chatMemory.slice(-5).join("\n");

    const today = format(new Date(), "d MMMM yyyy HH:mm", { locale: th });

    const fullPrompt = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}

          วันที่: ${today}

          ประวัติการสนทนา:
          ${memoryText}

          ${mode === "rag" ? `บริบท:\n${context}\n` : ""}

          คำถาม:
          ${message}`,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fullPrompt),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const responseText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "ขออภัยค่ะ ไม่สามารถประมวลผลคำตอบได้";

    if (mode === "gemini") {
      geminiChatMemory.push(`🧑‍💼 ${message}\n🤖 ${responseText}`);
    } else {
      ragChatMemory.push(`🧑‍💼 ${message}\n🤖 ${responseText}`);
    }

    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ 🙏";
  }
}
