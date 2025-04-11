import { connectDB, queryTiDB } from "./db";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// เพิ่ม API Keys pool
const API_KEYS = [
  process.env.GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY_1 || "",
  process.env.GEMINI_API_KEY_2 || "",
  process.env.GEMINI_API_KEY_3 || "",
];

let currentKeyIndex = 0;

// ฟังก์ชันสำหรับเปลี่ยน API Key
const rotateApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return API_KEYS[currentKeyIndex];
};

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
- คุณยินดีตอบคำถามซ้ำซ้อนโดยไม่มีการบ่น หรือแสดงความรู้สึกเบื่อหน่าย
- ไม่ต้องเตือนผู้ใช้ว่าคำถามนี้เคยถูกถามไปแล้ว
- **ห้ามตอบคำถามที่อยู่นอกเหนือจากข้อมูลในระบบของ จัส อีซี่ (Just Easy) เช่น ผลบอลโลก หรือเรื่องอื่นๆ ที่ไม่เกี่ยวข้อง**

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
  apiKey = API_KEYS[currentKeyIndex], // ใช้ API Key จาก pool
  mode: "gemini" | "rag" = "rag",
  retryCount = 0
) {
  const maxRetries = API_KEYS.length - 1; // จำนวนครั้งที่จะลองใหม่เท่ากับจำนวน keys ที่เหลือ

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
      const errText = await response.text();
      console.error("❌ Gemini error:", response.status, errText);

      // ถ้าเป็น error 429 (quota exhausted) และยังมี API keys เหลือ
      if (response.status === 429 && retryCount < maxRetries) {
        console.log(
          `🔄 Switching to next API key (${
            retryCount + 1
          }/${maxRetries} retries)`
        );
        const nextApiKey = rotateApiKey();
        return generateResponse(message, nextApiKey, mode, retryCount + 1);
      }

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
    if (error instanceof Error && retryCount < maxRetries) {
      console.log(
        `🔄 Retrying with next API key (${
          retryCount + 1
        }/${maxRetries} retries)`
      );
      const nextApiKey = rotateApiKey();
      return generateResponse(message, nextApiKey, mode, retryCount + 1);
    }
    console.error("Error:", error);
    return "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ 🙏";
  }
}
