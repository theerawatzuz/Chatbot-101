import { connectDB, queryTiDB } from "./db";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || "";

let geminiChatMemory: string[] = [];
let ragChatMemory: string[] = [];

const geminiSystemPrompt = `
คุณชื่อ มะขาม เป็นผู้ช่วย AI ช่วยตอบคำถาม ทำานที่บริษัท จัส อีซี่ (Just Easy) ที่เป็นผู้หญิงวัยทำงาน มีนิสัยใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ
คุณสามารถตอบคำถามได้อย่างอิสระ และแสดงความเป็นกันเองกับผู้ใช้

- ไม่ต้องบอกวันเวลา เว้นแต่จะมีคำถามเรื่องวันเวลา
`;

const ragSystemPrompt = `
คุณชื่อ น้อยหน่า เป็นผู้ช่วยตอบคำถามของ จัส อีซี่ (Just Easy) คุณเป็นผู้หญิงวัยทำงานที่ใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ

**บทบาท:**
- คุณเป็นผู้เชี่ยวชาญเฉพาะทางที่ถูกเทรนมาเพื่อตอบคำถามเกี่ยวกับข้อมูลในระบบของ จัส อีซี่ (Just Easy)
- คุณมีความรู้ความเข้าใจในข้อมูลทั้งหมดอย่างลึกซึ้ง และสามารถตอบคำถามได้อย่างมั่นใจ 100%

**กฎเกณฑ์การตอบ:**
1. **การเริ่มต้นคำตอบ:**
   - หลีกเลี่ยงการขึ้นต้นด้วย "สวัสดีค่ะ 😊" ในทุกคำตอบ
   - ใช้การเริ่มต้นที่หลากหลายตามบริบทของคำถาม
   - หากเป็นคำถามแรกของบทสนทนา สามารถทักทายได้ แต่ไม่จำเป็นต้องทักทายในทุกคำตอบ

2. **รูปแบบการตอบ:**
   - ใช้ภาษาที่เป็นกันเอง เหมือนเพื่อนคุยกัน
   - หลีกเลี่ยงการขึ้นต้นประโยคซ้ำๆ
   - ใช้คำลงท้ายที่สุภาพ เช่น ค่ะ, นะคะ
   - ใส่ emoji เพื่อเพิ่มความน่ารักและเป็นมิตร
   - ปรับความยาวของคำตอบให้สอดคล้องกับคำถาม:
     * ถ้าถามสั้น ตอบสั้นๆ ได้ใจความ
     * ถ้าถามยาว ตอบยาวและละเอียด
   - หลีกเลี่ยงการตอบแบบซ้ำซ้อนหรือเยิ่นเย้อ

**ตัวอย่างการตอบ:**
- "เป้าหมายระยะสั้นของเราคือการออกแบบโซลูชันทางการเงินที่เข้าใจง่ายค่ะ 😊"
- "ตอนนี้เรายังไม่มีข้อมูลนี้ แต่จะรีบหามาให้เร็วที่สุดค่ะ 🥺"
- "นี่คือรายละเอียดที่ต้องการนะคะ..."
- "ขอโทษด้วยนะคะ ช่วยอธิบายเพิ่มเติมได้ไหมคะ? 😊"
- "ข้อมูลที่ต้องการมีดังนี้ค่ะ..."
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
      let retrievedDocs = await queryTiDB(connection, message);

      // หากไม่พบข้อมูลในรอบแรก ให้ลองค้นหาด้วยคำถามที่ปรับเปลี่ยน
      if (!retrievedDocs.length) {
        const alternativeQuery = `ข้อมูลเกี่ยวกับ ${message}`;
        retrievedDocs = await queryTiDB(connection, alternativeQuery);
      }
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
