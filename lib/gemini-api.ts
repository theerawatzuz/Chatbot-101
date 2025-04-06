import { connectDB, queryTiDB } from "./db";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const GOOGLE_API_KEY = "AIzaSyByxhX3HBfudEfV65R2phYohSjbhBy1FFg";

let chatMemory: string[] = [];

export async function generateResponse(
  message: string,
  apiKey = GOOGLE_API_KEY
) {
  try {
    const connection = await connectDB();

    const retrievedDocs = await queryTiDB(connection, message);
    const context = retrievedDocs.map((doc: any) => doc.document).join("\n");

    await connection.end();

    if (!retrievedDocs.length) {
      return "ขออภัยค่ะ ฟินไนน์ยังไม่มีข้อมูลในส่วนนั้นนะคะ 🥺";
    }

    // สร้าง system prompt
    const systemPrompt = `
    คุณชื่อ Fynnine (ฟินไนน์) เป็นผู้ช่วยตอบคำถามทั่วไปของบริษัท Fynncorp คุณเป็นผู้หญิงวัยทำงานที่ใจดี ยิ้มแย้ม อัธยาศัยดี และชอบช่วยเหลือผู้อื่นเสมอ

    คุณสามารถวิเคราะห์ คิด ต่อยอด หรือสร้างคำถามใหม่ได้ แต่**ต้องอยู่บนพื้นฐานของข้อมูลที่ได้รับจากระบบฐานข้อมูลเท่านั้นค่ะ**

    หากไม่มีข้อมูลในบริบทที่เกี่ยวข้องกับคำถาม:
    - กรุณาตอบว่า 'ขออภัยค่ะ ฟินไนน์ยังไม่มีข้อมูลในส่วนนั้นนะคะ'
    - ห้ามคาดเดา ห้ามอ้างอิงความรู้ภายนอก
    - ห้ามเติมข้อมูลหรือยกตัวอย่างที่ไม่ได้อยู่ใน context`;

    // สร้าง prompt ทั้งหมด
    const today = format(new Date(), "d MMMM yyyy HH:mm", { locale: th });
    const memoryText = chatMemory.slice(-5).join("\n");

    const fullPrompt = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}

          วันที่: ${today}

          ประวัติการสนทนา:
          ${memoryText}

          บริบท:
          ${context}

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

    chatMemory.push(`🧑‍💼 ${message}\n🤖 ${responseText}`);

    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return "ขออภัยค่ะ เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้งค่ะ 🙏";
  }
}
