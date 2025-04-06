import mysql from "mysql2/promise";
import { createEmbedding } from "./embeddings";

export async function connectDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 4000,
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "",
      ssl: {
        rejectUnauthorized: false,
      },
    });
    return connection;
  } catch (error) {
    console.error("Failed to connect to TiDB:", error);
    throw error;
  }
}

// TEST CONNECTION
export async function testConnection() {
  try {
    const conn = await connectDB();
    const [rows] = await conn.execute("SELECT 1");
    console.log("Test query result:", rows);
    await conn.end();
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
}

// ฟังก์ชันค้นหาข้อมูลจาก vector database
export async function queryTiDB(connection: any, queryText: string, k = 5) {
  try {
    // แปลงข้อความเป็น embedding vector
    const queryEmbedding = await createEmbedding(queryText);

    // สร้าง SQL query แบบ string interpolation เหมือนในโค้ด Python
    const sql_query = `
      SELECT document, vec_cosine_distance(embedding, '${queryEmbedding}') AS distance
      FROM documents
      ORDER BY distance
      LIMIT ${k}
    `;

    // ใช้ execute แบบไม่มี parameterized query
    const [rows] = await connection.execute(sql_query);
    return rows;
  } catch (error) {
    console.error("Query error:", error);
    return [];
  }
}

// ฟังก์ชันเพิ่มเอกสารพร้อม embedding
export async function addDocument(connection: any, text: string) {
  try {
    // สร้าง embedding vector
    const embedding = await createEmbedding(text);

    // เพิ่มข้อมูลลงในฐานข้อมูล
    const [result] = await connection.execute(
      "INSERT INTO documents (document, embedding) VALUES (?, ?)",
      [text, embedding]
    );

    return result.insertId;
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
}
